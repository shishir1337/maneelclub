"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { OrderStatus } from "@prisma/client";

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

// Get all orders (admin)
export async function getAdminOrders(options?: {
  status?: OrderStatus;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await checkAdmin();

    const where: any = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search) {
      where.OR = [
        { orderNumber: { contains: options.search, mode: "insensitive" } },
        { customerName: { contains: options.search, mode: "insensitive" } },
        { customerEmail: { contains: options.search, mode: "insensitive" } },
        { customerPhone: { contains: options.search } },
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

    const orders = ordersRaw.map((o) => ({
      ...o,
      total: Number(o.total),
      items: o.items.map((item) => ({ ...item, price: Number(item.price) })),
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
export async function getOrderById(id: string) {
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

    return { success: true, data: order };
  } catch (error) {
    console.error("Error fetching order:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch order" 
    };
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
    revalidatePath(`/dashboard/orders`);

    return { success: true, data: updated };
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

// Delete order (use with caution)
export async function deleteOrder(id: string) {
  try {
    await checkAdmin();

    const order = await db.order.findUnique({ where: { id } });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Delete order items first, then order
    await db.orderItem.deleteMany({ where: { orderId: id } });
    await db.order.delete({ where: { id } });

    revalidatePath("/admin/orders");

    return { success: true };
  } catch (error) {
    console.error("Error deleting order:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete order" 
    };
  }
}
