"use server";

import { db } from "@/lib/db";
import { generateOrderNumber } from "@/lib/format";
import { getShippingRates } from "@/lib/settings";
import { checkoutSchema, CheckoutFormData } from "@/schemas/checkout";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { sendPurchaseEvent } from "@/lib/conversions-api";
import { getMetaCapiSettings } from "@/lib/settings";

interface CartItem {
  productId: string;
  title: string;
  image: string;
  price: number;
  color: string;
  size: string;
  quantity: number;
  variantId?: string; // Optional variant ID for variable products
}

interface CreateOrderInput {
  formData: CheckoutFormData;
  items: CartItem[];
}

/**
 * Deduct stock for order items
 * Handles both simple products (product.stock) and variable products (variant.stock)
 */
async function deductStock(items: CartItem[]) {
  for (const item of items) {
    // Get the product to check its type
    const product = await db.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: {
          include: {
            attributes: {
              include: {
                attributeValue: true,
              },
            },
          },
        },
      },
    });

    if (!product) continue;

    if (product.productType === "VARIABLE" && product.variants.length > 0) {
      // For variable products, find matching variant by color and size
      const matchingVariant = product.variants.find((variant) => {
        const variantAttributes = variant.attributes.map(
          (attr) => attr.attributeValue.displayValue.toLowerCase()
        );
        return (
          variantAttributes.includes(item.color.toLowerCase()) &&
          variantAttributes.includes(item.size.toLowerCase())
        );
      });

      if (matchingVariant) {
        // Deduct from variant stock
        await db.productVariant.update({
          where: { id: matchingVariant.id },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    } else {
      // For simple products, deduct from product stock
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }
  }
}

/**
 * Create a new order (saves to database)
 */
export async function createOrder(input: CreateOrderInput) {
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
    
    // Calculate totals (shipping from admin settings via shippingZone)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const rates = await getShippingRates();
    const shippingCost =
      formData.shippingZone === "inside_dhaka" ? rates.dhaka : rates.outside;
    const total = subtotal + shippingCost;
    
    // Determine payment method and status
    const paymentMethod = (formData.paymentMethod || "COD") as PaymentMethod;
    // All orders start as PROCESSING order status and PENDING payment status
    // COD orders will be marked PAID on delivery
    // Mobile payments will be verified by admin
    const paymentStatus: PaymentStatus = "PENDING";
    
    // Create order in database using a transaction to ensure stock deduction is atomic
    const order = await db.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          customerName: formData.fullName,
          customerEmail: formData.email || null,
          customerPhone: formData.phone,
          shippingAddress: formData.address,
          city: formData.city,
          altPhone: formData.altPhone || null,
          deliveryNote: formData.deliveryNote || null,
          shippingCost,
          subtotal,
          total,
          status: "PROCESSING",
          // Payment fields
          paymentMethod,
          paymentStatus,
          senderNumber: formData.senderNumber || null,
          transactionId: formData.transactionId || null,
          items: {
            create: items.map((item) => ({
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

      // Deduct stock for each item
      for (const item of items) {
        // Get the product to check its type
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            variants: {
              include: {
                attributes: {
                  include: {
                    attributeValue: true,
                  },
                },
              },
            },
          },
        });

        if (!product) continue;

        if (product.productType === "VARIABLE" && product.variants.length > 0) {
          // For variable products, find matching variant by color and size
          const matchingVariant = product.variants.find((variant) => {
            const variantAttributes = variant.attributes.map(
              (attr) => attr.attributeValue.displayValue.toLowerCase()
            );
            return (
              variantAttributes.includes(item.color.toLowerCase()) &&
              variantAttributes.includes(item.size.toLowerCase())
            );
          });

          if (matchingVariant) {
            // Deduct from variant stock
            await tx.productVariant.update({
              where: { id: matchingVariant.id },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        } else {
          // For simple products, deduct from product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

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
      const h = await headers();
      const clientIp =
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        h.get("x-real-ip")?.trim() ||
        undefined;
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
