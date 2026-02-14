"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { courierCheckByPhone, type CourierCheckData } from "@/lib/bdcourier";

// Helper to check admin role
async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required");
  }

  return session.user;
}

/** Serialized order shape returned by getOrderById (Decimals as numbers for client). */
export type OrderDetailData = {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  altPhone: string | null;
  deliveryNote: string | null;
  shippingCost: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  senderNumber: string | null;
  transactionId: string | null;
  paidAt: Date | null;
  clientIp: string | null;
  courierCheckData: CourierCheckData | null;
  courierCheckCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    orderId: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      title: string;
      slug: string;
      images: string[];
      regularPrice: number;
      salePrice: number | null;
    } | null;
  }>;
  user: { id: string; name: string | null; email: string } | null;
};

// Get all orders (admin)
export async function getAdminOrders(options?: {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await checkAdmin();

    const where: Record<string, unknown> = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.paymentStatus) {
      where.paymentStatus = options.paymentStatus;
    }

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.search) {
      where.OR = [
        { orderNumber: { contains: options.search, mode: "insensitive" } },
        { customerName: { contains: options.search, mode: "insensitive" } },
        { customerEmail: { contains: options.search, mode: "insensitive" } },
        { customerPhone: { contains: options.search } },
        { senderNumber: { contains: options.search } },
        { transactionId: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [ordersRaw, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          user: true,
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      db.order.count({ where }),
    ]);

    // Count how many times each customer has purchased (match by phone or email)
    const purchaseCounts = await Promise.all(
      ordersRaw.map((o) =>
        db.order.count({
          where: {
            OR: [
              { customerPhone: o.customerPhone },
              ...(o.customerEmail
                ? [{ customerEmail: o.customerEmail }]
                : []),
            ],
          },
        })
      )
    );

    const orders = ordersRaw.map((o, i) => ({
      ...o,
      clientIp: (o as { clientIp?: string | null }).clientIp ?? null,
      shippingCost: Number(o.shippingCost),
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      timesPurchased: purchaseCounts[i] ?? 0,
      items: o.items.map((item) => ({
        ...item,
        price: Number(item.price),
        product: item.product
          ? {
              ...item.product,
              regularPrice: Number(item.product.regularPrice),
              salePrice: item.product.salePrice
                ? Number(item.product.salePrice)
                : null,
            }
          : null,
      })),
    }));

    return { success: true, data: { orders, total } };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch orders" 
    };
  }
}

// Get single order by ID
export async function getOrderById(
  id: string
): Promise<{ success: true; data: OrderDetailData } | { success: false; error: string }> {
  try {
    await checkAdmin();

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Build plain object with all Decimals as numbers (required for client components)
    const serializedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      city: order.city,
      altPhone: order.altPhone,
      deliveryNote: order.deliveryNote,
      shippingCost: Number(order.shippingCost),
      subtotal: Number(order.subtotal),
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      senderNumber: order.senderNumber,
      transactionId: order.transactionId,
      paidAt: order.paidAt,
      clientIp: order.clientIp ?? null,
      courierCheckData: (order as { courierCheckData?: CourierCheckData | null }).courierCheckData ?? null,
      courierCheckCheckedAt: (order as { courierCheckCheckedAt?: Date | null }).courierCheckCheckedAt ?? null,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        orderId: item.orderId,
        color: item.color,
        size: item.size,
        quantity: item.quantity,
        price: Number(item.price),
        product: item.product
          ? {
              id: item.product.id,
              title: item.product.title,
              slug: item.product.slug,
              images: item.product.images,
              regularPrice: Number(item.product.regularPrice),
              salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
            }
          : null,
      })),
      user: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
          }
        : null,
    };

    return { success: true, data: serializedOrder as OrderDetailData };
  } catch (err) {
    console.error("Error fetching order:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch order",
    };
  }
}

// Refresh courier check for an order (admin-only). Fetches from BDCourier API and saves to order.
export async function refreshCourierCheck(orderId: string): Promise<
  | { success: true; data: CourierCheckData }
  | { success: false; error: string }
> {
  try {
    await checkAdmin();

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, customerPhone: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const phone = order.customerPhone?.trim();
    if (!phone) {
      return { success: false, error: "Order has no customer phone number" };
    }

    const result = await courierCheckByPhone(phone);
    if (!result.success) {
      // Error is already sanitized by courierCheckByPhone
      return { success: false, error: result.error };
    }

    const payload = result.data;
    await db.order.update({
      where: { id: orderId },
      data: {
        courierCheckData: payload as unknown as Prisma.InputJsonValue,
        courierCheckCheckedAt: new Date(),
      } as Prisma.OrderUpdateInput,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true, data: payload };
  } catch (error) {
    console.error("Error refreshing courier check:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to refresh courier check",
    };
  }
}

// Restore stock for order items (used when order is cancelled)
async function restoreStockForOrder(orderId: string) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
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
          },
        },
      },
    },
  });

  if (!order) return;

  for (const item of order.items) {
    const product = item.product;
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
        // Restore variant stock
        await db.productVariant.update({
          where: { id: matchingVariant.id },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    } else {
      // For simple products, restore product stock
      await db.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  }
}

// Update order status
export async function updateOrderStatus(id: string, status: OrderStatus) {
  try {
    await checkAdmin();

    const order = await db.order.findUnique({ where: { id } });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if order is being cancelled from a non-cancelled state
    const wasNotCancelled = order.status !== "CANCELLED";
    const isBeingCancelled = status === "CANCELLED";

    // If order is being cancelled, restore stock
    if (wasNotCancelled && isBeingCancelled) {
      await restoreStockForOrder(id);
    }

    const updated = await db.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");
    revalidatePath(`/dashboard/orders`);

    // Convert Decimal fields to numbers
    const serializedOrder = {
      ...updated,
      shippingCost: Number(updated.shippingCost),
      subtotal: Number(updated.subtotal),
      total: Number(updated.total),
      items: updated.items.map((item) => ({ 
        ...item, 
        price: Number(item.price),
        product: item.product ? {
          ...item.product,
          regularPrice: Number(item.product.regularPrice),
          salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
        } : null,
      })),
    };

    return { success: true, data: serializedOrder };
  } catch (error) {
    console.error("Error updating order status:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update order" 
    };
  }
}

// Get order statistics
export async function getOrderStats() {
  try {
    await checkAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthOrders,
      lastMonthOrders,
    ] = await Promise.all([
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { status: "DELIVERED" } }),
      db.order.count({ where: { status: "CANCELLED" } }),
      db.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      db.order.aggregate({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      db.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      db.order.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        thisMonthRevenue: Number(thisMonthRevenue._sum.total ?? 0),
        lastMonthRevenue: Number(lastMonthRevenue._sum.total ?? 0),
        thisMonthOrders,
        lastMonthOrders,
      },
    };
  } catch (error) {
    console.error("Error fetching order stats:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch statistics" 
    };
  }
}

// Get recent orders
export async function getRecentOrders(limit: number = 5) {
  try {
    await checkAdmin();

    const ordersRaw = await db.order.findMany({
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const orders = ordersRaw.map((o) => ({
      ...o,
      shippingCost: Number(o.shippingCost),
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      items: o.items.map((item) => ({ ...item, price: Number(item.price) })),
    }));

    return { success: true, data: orders };
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch orders" 
    };
  }
}

// Delete order (use with caution - e.g. test orders)
export async function deleteOrder(id: string) {
  try {
    await checkAdmin();

    const order = await db.order.findUnique({ where: { id } });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Restore stock if order wasn't cancelled or delivered
    if (order.status !== "CANCELLED" && order.status !== "DELIVERED") {
      await restoreStockForOrder(id);
    }

    // Delete order items first, then order
    await db.orderItem.deleteMany({ where: { orderId: id } });
    await db.order.delete({ where: { id } });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete order" 
    };
  }
}

// Bulk delete orders
export async function bulkDeleteOrders(
  orderIds: string[]
): Promise<
  | { success: true; deleted: number; skipped: number }
  | { success: false; error: string }
> {
  try {
    await checkAdmin();

    let deleted = 0;
    let skipped = 0;

    for (const id of orderIds) {
      const order = await db.order.findUnique({ where: { id } });
      if (!order) {
        skipped++;
        continue;
      }

      if (order.status !== "CANCELLED" && order.status !== "DELIVERED") {
        await restoreStockForOrder(id);
      }

      await db.orderItem.deleteMany({ where: { orderId: id } });
      await db.order.delete({ where: { id } });
      deleted++;
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");

    return { success: true, deleted, skipped };
  } catch (error) {
    console.error("Error bulk deleting orders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete orders",
    };
  }
}

// Verify payment (marks as PAID and changes order status to PROCESSING)
export async function verifyPayment(orderId: string) {
  try {
    await checkAdmin();

    const order = await db.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.paymentStatus === "PAID") {
      return { success: false, error: "Payment already verified" };
    }

    if (order.paymentMethod === "COD") {
      return { success: false, error: "COD orders cannot be verified this way" };
    }

    // Check if transaction ID and sender number exist
    if (!order.transactionId || !order.senderNumber) {
      return { success: false, error: "Missing payment details" };
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        // Also move order to PROCESSING status after payment verification
        status: order.status === "PENDING" ? "PROCESSING" : order.status,
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/dashboard/orders");

    return { 
      success: true, 
      data: updated,
      message: "Payment verified successfully" 
    };
  } catch (error) {
    console.error("Error verifying payment:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to verify payment" 
    };
  }
}

// Reject payment (marks as FAILED)
export async function rejectPayment(orderId: string, reason?: string) {
  try {
    await checkAdmin();

    const order = await db.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.paymentStatus === "PAID") {
      return { success: false, error: "Cannot reject an already verified payment" };
    }

    if (order.paymentMethod === "COD") {
      return { success: false, error: "COD orders cannot be rejected this way" };
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "FAILED",
        // Optionally cancel the order
        status: "CANCELLED",
        // Add reason to delivery note for tracking
        deliveryNote: reason 
          ? `${order.deliveryNote || ""}\n[Payment Rejected: ${reason}]`.trim()
          : order.deliveryNote,
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/dashboard/orders");

    return { 
      success: true, 
      data: updated,
      message: "Payment rejected and order cancelled" 
    };
  } catch (error) {
    console.error("Error rejecting payment:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to reject payment" 
    };
  }
}

// Bulk update order status
export async function bulkUpdateOrderStatus(
  orderIds: string[],
  status: OrderStatus
): Promise<
  | { success: true; updated: number; skipped: number }
  | { success: false; error: string }
> {
  try {
    await checkAdmin();

    let updated = 0;
    let skipped = 0;

    for (const id of orderIds) {
      const order = await db.order.findUnique({ where: { id } });
      if (!order) {
        skipped++;
        continue;
      }

      const wasNotCancelled = order.status !== "CANCELLED";
      const isBeingCancelled = status === "CANCELLED";
      if (wasNotCancelled && isBeingCancelled) {
        await restoreStockForOrder(id);
      }

      await db.order.update({ where: { id }, data: { status } });
      updated++;
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");
    revalidatePath("/dashboard/orders");

    return { success: true, updated, skipped };
  } catch (error) {
    console.error("Error bulk updating order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk update order status",
    };
  }
}

// Bulk verify payment
export async function bulkVerifyPayment(
  orderIds: string[]
): Promise<
  | { success: true; verified: number; skipped: number }
  | { success: false; error: string }
> {
  try {
    await checkAdmin();

    let verified = 0;
    let skipped = 0;

    for (const id of orderIds) {
      const order = await db.order.findUnique({ where: { id } });
      if (!order) {
        skipped++;
        continue;
      }
      if (order.paymentStatus === "PAID") {
        skipped++;
        continue;
      }
      if (order.paymentMethod === "COD") {
        skipped++;
        continue;
      }
      if (!order.transactionId || !order.senderNumber) {
        skipped++;
        continue;
      }

      await db.order.update({
        where: { id },
        data: {
          paymentStatus: "PAID",
          paidAt: new Date(),
          status: order.status === "PENDING" ? "PROCESSING" : order.status,
        },
      });
      verified++;
    }

    revalidatePath("/admin/orders");
    revalidatePath("/dashboard/orders");

    return { success: true, verified, skipped };
  } catch (error) {
    console.error("Error bulk verifying payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk verify payment",
    };
  }
}

// Bulk reject payment
export async function bulkRejectPayment(
  orderIds: string[],
  reason?: string
): Promise<
  | { success: true; rejected: number; skipped: number }
  | { success: false; error: string }
> {
  try {
    await checkAdmin();

    let rejected = 0;
    let skipped = 0;

    for (const id of orderIds) {
      const order = await db.order.findUnique({ where: { id } });
      if (!order) {
        skipped++;
        continue;
      }
      if (order.paymentStatus === "PAID") {
        skipped++;
        continue;
      }
      if (order.paymentMethod === "COD") {
        skipped++;
        continue;
      }

      await restoreStockForOrder(id);

      await db.order.update({
        where: { id },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
          deliveryNote: reason
            ? `${order.deliveryNote || ""}\n[Payment Rejected: ${reason}]`.trim()
            : order.deliveryNote,
        },
      });
      rejected++;
    }

    revalidatePath("/admin/orders");
    revalidatePath("/dashboard/orders");

    return { success: true, rejected, skipped };
  } catch (error) {
    console.error("Error bulk rejecting payment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk reject payment",
    };
  }
}

// Update payment status directly
export async function updatePaymentStatus(orderId: string, paymentStatus: PaymentStatus) {
  try {
    await checkAdmin();

    const order = await db.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const updateData: { paymentStatus: PaymentStatus; paidAt?: Date } = { paymentStatus };
    
    // Set paidAt when marking as PAID
    if (paymentStatus === "PAID") {
      updateData.paidAt = new Date();
    }

    const updated = await db.order.update({
      where: { id: orderId },
      data: updateData,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/dashboard/orders");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update payment status" 
    };
  }
}

// Get orders by payment status
export async function getOrdersByPaymentStatus(paymentStatus: PaymentStatus) {
  try {
    await checkAdmin();

    const ordersRaw = await db.order.findMany({
      where: { paymentStatus },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const orders = ordersRaw.map((o) => ({
      ...o,
      shippingCost: Number(o.shippingCost),
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      items: o.items.map((item) => ({ 
        ...item, 
        price: Number(item.price),
        product: item.product ? {
          ...item.product,
          regularPrice: Number(item.product.regularPrice),
          salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
        } : null,
      })),
    }));

    return { success: true, data: orders };
  } catch (error) {
    console.error("Error fetching orders by payment status:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch orders" 
    };
  }
}

