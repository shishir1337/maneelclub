"use server";

import { db } from "@/lib/db";
import { getShippingRates, getFreeShippingMinimum, getOrderCooldownSettings } from "@/lib/settings";
import { checkoutSchema, CheckoutFormData } from "@/schemas/checkout";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { sendPurchaseEvent } from "@/lib/conversions-api";
import { getMetaCapiSettings } from "@/lib/settings";
import { getClientIp } from "@/lib/client-ip";
import { isIpBanned } from "@/lib/ip-ban";

interface CartItem {
  productId: string;
  title: string;
  image: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  variantId?: string;
}

/** Server-resolved line item: price and stock validated from DB; used for order creation. */
interface ResolvedLineItem {
  productId: string;
  title: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  variantId?: string;
}

interface CreateOrderInput {
  formData: CheckoutFormData;
  items: CartItem[];
  /** Optional: coupon ID from validateCoupon. Server re-validates and applies discount. */
  couponId?: string | null;
}

/** Result of createOrder: success with order ids, or failure with error and optional code/cooldown. */
export type CreateOrderResult =
  | { success: true; data: { orderId: string; orderNumber: string } }
  | {
      success: false;
      error: string;
      code?: "COOLDOWN" | "IP_BANNED";
      cooldownRemainingSeconds?: number;
      cooldownMinutes?: number;
    };

/**
 * Resolve cart items against the database: validate product exists and is active,
 * resolve variant (for variable products), enforce stock, and return server-side prices.
 * Never trust client-supplied price or quantity for totals.
 */
async function resolveCartItems(items: CartItem[]): Promise<
  { success: true; resolved: ResolvedLineItem[] } | { success: false; error: string }
> {
  const resolved: ResolvedLineItem[] = [];

  for (const item of items) {
    if (item.quantity < 1) {
      return { success: false, error: `Invalid quantity for ${item.title || item.productId}` };
    }

    const product = await db.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: {
          include: {
            attributes: {
              include: {
                attributeValue: { include: { attribute: true } },
              },
            },
          },
        },
      },
    });

    if (!product) {
      return { success: false, error: `Product not found: ${item.title || item.productId}` };
    }
    if (!product.isActive) {
      return { success: false, error: `Product is no longer available: ${product.title}` };
    }

    const regularPrice = Number(product.regularPrice?.toString() ?? 0);
    const salePrice = product.salePrice != null ? Number(product.salePrice.toString()) : null;
    const productPrice = salePrice != null && salePrice < regularPrice ? salePrice : regularPrice;

    if (product.productType === "VARIABLE" && product.variants.length > 0) {
      const matchingVariant = product.variants.find((variant) => {
        const variantAttributes = variant.attributes.map(
          (attr) => attr.attributeValue.displayValue.toLowerCase()
        );
        return (
          variantAttributes.includes(item.color.toLowerCase()) &&
          variantAttributes.includes(item.size.toLowerCase())
        );
      });

      if (!matchingVariant) {
        return {
          success: false,
          error: `Variant (${item.color} / ${item.size}) not found for ${product.title}`,
        };
      }

      const variantStock = matchingVariant.stock ?? 0;
      if (variantStock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.title} (${item.color} / ${item.size}). Available: ${variantStock}`,
        };
      }

      const variantPrice = matchingVariant.price != null ? Number(matchingVariant.price.toString()) : null;
      const effectivePrice = variantPrice ?? productPrice;

      resolved.push({
        productId: item.productId,
        title: product.title,
        image: item.image || (product.images?.[0] ?? ""),
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: effectivePrice,
        variantId: matchingVariant.id,
      });
    } else {
      const stock = product.stock ?? 0;
      if (stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.title}. Available: ${stock}`,
        };
      }

      resolved.push({
        productId: item.productId,
        title: product.title,
        image: item.image || (product.images?.[0] ?? ""),
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: productPrice,
      });
    }
  }

  return { success: true, resolved };
}

/**
 * Deduct stock for order items (called inside transaction with resolved items).
 */
async function deductStockInTransaction(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  items: ResolvedLineItem[]
) {
  for (const item of items) {
    if (item.variantId) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    } else {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  }
}

/**
 * Create a new order (saves to database)
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    // Validate form data
    const validatedData = checkoutSchema.safeParse(input.formData);
    
    if (!validatedData.success) {
      return {
        success: false,
        error: validatedData.error.issues[0]?.message || "Invalid form data",
      };
    }
    
    const { items, formData } = input;

    if (!items || items.length === 0) {
      return {
        success: false,
        error: "No items in cart",
      };
    }

    // Resolve all cart items server-side: validate products, variants, stock, and get authoritative prices
    const resolution = await resolveCartItems(items);
    if (!resolution.success) {
      return { success: false, error: resolution.error };
    }
    const resolvedItems = resolution.resolved;

    // Get user if logged in
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({
        headers: await headers(),
      });
      userId = session?.user?.id || null;
    } catch {
      // User not logged in, that's fine for guest checkout
    }

    // Calculate totals from server-resolved prices (never from client)
    const subtotal = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const [rates, freeShippingMinimum] = await Promise.all([
      getShippingRates(),
      getFreeShippingMinimum(),
    ]);
    const zoneRate = formData.shippingZone === "inside_dhaka" ? rates.dhaka : rates.outside;
    const shippingCost =
      freeShippingMinimum > 0 && subtotal >= freeShippingMinimum ? 0 : zoneRate;

    // Apply coupon discount (server-side validation)
    let discountAmount = 0;
    let couponId: string | null = null;
    if (input.couponId?.trim()) {
      const coupon = await db.coupon.findUnique({
        where: { id: input.couponId.trim(), isActive: true },
      });
      if (coupon) {
        const now = new Date();
        const ok =
          (!coupon.validFrom || now >= coupon.validFrom) &&
          (!coupon.validUntil || now <= coupon.validUntil) &&
          (coupon.maxUses == null || coupon.usedCount < coupon.maxUses) &&
          (coupon.minOrderAmount == null || Number(coupon.minOrderAmount) <= subtotal);
        if (ok) {
          const val = Number(coupon.value);
          discountAmount =
            coupon.type === "PERCENT"
              ? Math.round((subtotal * val) / 100 * 100) / 100
              : Math.min(val, subtotal);
          if (discountAmount > 0) couponId = coupon.id;
        }
      }
    }
    const total = Math.max(0, subtotal - discountAmount + shippingCost);
    
    // Determine payment method and status
    const paymentMethod = (formData.paymentMethod || "COD") as PaymentMethod;
    // All orders start as PROCESSING order status and PENDING payment status
    // COD orders will be marked PAID on delivery
    // Mobile payments will be verified by admin
    const paymentStatus: PaymentStatus = "PENDING";

    const h = await headers();
    const clientIp = getClientIp(h);

    // IP ban: blocked IPs cannot place orders
    if (clientIp && (await isIpBanned(clientIp))) {
      return {
        success: false,
        error: "Unable to place an order. Please contact support.",
        code: "IP_BANNED",
      };
    }

    // Order cooldown: same IP cannot order again within X minutes (when enabled)
    const cooldown = await getOrderCooldownSettings();
    if (cooldown.enabled && clientIp) {
      const lastOrder = await db.order.findFirst({
        where: { clientIp },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      if (lastOrder) {
        const windowMs = cooldown.minutes * 60 * 1000;
        const elapsed = Date.now() - lastOrder.createdAt.getTime();
        if (elapsed < windowMs) {
          const cooldownRemainingSeconds = Math.ceil((windowMs - elapsed) / 1000);
          return {
            success: false,
            error: "You already placed an order. Please wait before placing another.",
            code: "COOLDOWN",
            cooldownRemainingSeconds,
            cooldownMinutes: cooldown.minutes,
          };
        }
      }
    }

    // Create order in database using a transaction to ensure stock deduction is atomic
    const order = await db.$transaction(async (tx) => {
      // Next serial order number (numeric only, starting from 2000)
      const rows = await tx.$queryRaw<Array<{ orderNumber: string }>>(
        Prisma.sql`SELECT "orderNumber" FROM "Order" WHERE "orderNumber" ~ '^[0-9]+$' ORDER BY ("orderNumber"::integer) DESC LIMIT 1`
      );
      const lastNum = rows[0] ? parseInt(rows[0].orderNumber, 10) : 1999;
      const orderNumber = String(Math.max(2000, lastNum + 1));

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          clientIp,
          customerName: formData.fullName,
          customerEmail: formData.email || null,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          city: formData.city,
          altPhone: formData.altPhone || null,
          deliveryNote: formData.deliveryNote || null,
          shippingCost,
          subtotal,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          total,
          status: "PROCESSING",
          couponId: couponId ?? undefined,
          // Payment fields
          paymentMethod,
          paymentStatus,
          senderNumber: formData.senderNumber || null,
          transactionId: formData.transactionId || null,
          items: {
            create: resolvedItems.map((item) => ({
              productId: item.productId,
              color: item.color,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      await deductStockInTransaction(tx, resolvedItems);
      return newOrder;
    });

    // Revalidate relevant paths
    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");
    if (userId) {
      revalidatePath("/dashboard/orders");
    }

    // Meta Conversions API: send Purchase for deduplication with Pixel (use orderNumber as event_id)
    // Credentials from env or admin settings (configure after deployment)
    try {
      const clientUserAgent = h.get("user-agent") ?? undefined;
      const capiSettings = await getMetaCapiSettings();
      const credentials =
        capiSettings.pixelId && capiSettings.accessToken
          ? { pixelId: capiSettings.pixelId, accessToken: capiSettings.accessToken }
          : undefined;
      await sendPurchaseEvent({
        order_id: order.orderNumber,
        value: Number(order.total),
        currency: "BDT",
        num_items: order.items.reduce((sum, i) => sum + i.quantity, 0),
        content_ids: order.items.map((i) => i.productId),
        email: order.customerEmail ?? formData.email ?? null,
        phone: order.customerPhone ?? formData.phone ?? null,
        client_ip_address: clientIp ?? null,
        client_user_agent: clientUserAgent ?? null,
        ...(credentials && { _credentials: credentials }),
      });
    } catch (e) {
      console.warn("[Conversions API] Purchase event failed:", e);
    }

    return {
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      error: "Failed to create order. Please try again.",
    };
  }
}

/**
 * Check if the current request (by IP) is allowed to place an order.
 * Used by checkout page to show cooldown countdown or block without submitting.
 * Does not return raw IP to client.
 */
export async function getCheckoutEligibility(): Promise<{
  allowed: boolean;
  error?: string;
  code?: "COOLDOWN" | "IP_BANNED";
  cooldownRemainingSeconds?: number;
  cooldownMinutes?: number;
}> {
  try {
    const h = await headers();
    const clientIp = getClientIp(h);

    if (clientIp && (await isIpBanned(clientIp))) {
      return {
        allowed: false,
        error: "Unable to place an order. Please contact us for assistance.",
        code: "IP_BANNED",
      };
    }

    const cooldown = await getOrderCooldownSettings();

    if (cooldown.enabled && clientIp) {
      const lastOrder = await db.order.findFirst({
        where: { clientIp },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      if (lastOrder) {
        const windowMs = cooldown.minutes * 60 * 1000;
        const elapsed = Date.now() - lastOrder.createdAt.getTime();
        if (elapsed < windowMs) {
          const cooldownRemainingSeconds = Math.ceil((windowMs - elapsed) / 1000);
          return {
            allowed: false,
            error: "You already placed an order. Please wait before placing another.",
            code: "COOLDOWN",
            cooldownRemainingSeconds,
            cooldownMinutes: cooldown.minutes,
          };
        }
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking checkout eligibility:", error);
    return { allowed: true }; // Fail open so checkout is not broken
  }
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string) {
  try {
    const order = await db.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        coupon: true,
      },
    });
    
    if (!order) {
      return {
        success: false,
        error: "Order not found",
        data: null,
      };
    }
    
    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      error: "Failed to fetch order",
      data: null,
    };
  }
}

/**
 * Get orders for current user (optionally limited for recent orders)
 */
export async function getUserOrders(limit?: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: "Not authenticated",
        data: [],
      };
    }

    const orders = await db.order.findMany({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(limit != null && { take: limit }),
    });

    // Serialize Decimal fields to numbers (required when passing to Client Components)
    const serializedOrders = orders.map((order) => ({
      ...order,
      shippingCost: Number(order.shippingCost),
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: Number(item.price),
        title: item.product?.title ?? "",
        product: item.product
          ? {
              ...item.product,
              regularPrice: Number(item.product.regularPrice),
              salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
            }
          : null,
      })),
    }));
    
    return {
      success: true,
      data: serializedOrders,
    };
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
      data: [],
    };
  }
}

/**
 * Get a single order by id for the current user (dashboard order details).
 * Returns 404 if order not found or not owned by the user.
 */
export async function getOrderForUser(orderId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: "Not authenticated",
        data: null,
      };
    }

    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        data: null,
      };
    }

    const serialized = {
      ...order,
      shippingCost: Number(order.shippingCost),
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: Number(item.price),
        title: item.product?.title ?? "",
        product: item.product
          ? {
              ...item.product,
              regularPrice: Number(item.product.regularPrice),
              salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
            }
          : null,
      })),
    };

    return {
      success: true,
      data: serialized,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      error: "Failed to fetch order",
      data: null,
    };
  }
}
