"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

// Get overview statistics
export async function getAnalyticsOverview() {
  try {
    await checkAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      thisMonthOrders,
      lastMonthOrders,
      thisMonthRevenue,
      lastMonthRevenue,
      totalRevenue,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      db.order.count(),
      db.product.count({ where: { isActive: true } }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      db.order.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
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
      db.order.aggregate({
        where: { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.count({ where: { status: "PROCESSING" } }),
      db.order.count({ where: { status: "DELIVERED" } }),
      db.order.count({ where: { status: "CANCELLED" } }),
    ]);

    // Calculate growth percentages
    const revenueGrowth =
      lastMonthRevenue._sum.total && Number(lastMonthRevenue._sum.total) > 0
        ? ((Number(thisMonthRevenue._sum.total || 0) -
            Number(lastMonthRevenue._sum.total)) /
            Number(lastMonthRevenue._sum.total)) *
          100
        : 0;

    const orderGrowth =
      lastMonthOrders > 0
        ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
        : 0;

    return {
      success: true,
      data: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalRevenue: Number(totalRevenue._sum.total || 0),
        thisMonthOrders,
        lastMonthOrders,
        thisMonthRevenue: Number(thisMonthRevenue._sum.total || 0),
        lastMonthRevenue: Number(lastMonthRevenue._sum.total || 0),
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        ordersByStatus: {
          pending: pendingOrders,
          processing: processingOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch analytics",
    };
  }
}

// Get revenue by period (daily for last 30 days, or monthly for last 12 months)
export async function getRevenueByPeriod(period: "daily" | "monthly" = "daily") {
  try {
    await checkAdmin();

    const now = new Date();
    let startDate: Date;
    let groupFormat: string;

    if (period === "daily") {
      // Last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else {
      // Last 12 months
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
    }

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: "CANCELLED" },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group orders by date
    const grouped: Record<string, number> = {};

    for (const order of orders) {
      const date = order.createdAt;
      let key: string;

      if (period === "daily") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      }

      grouped[key] = (grouped[key] || 0) + Number(order.total);
    }

    // Convert to array with all dates (fill gaps with 0)
    const data: { date: string; revenue: number }[] = [];
    const current = new Date(startDate);

    while (current <= now) {
      let key: string;
      let label: string;

      if (period === "daily") {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(current.getDate()).padStart(2, "0")}`;
        label = `${current.getDate()}/${current.getMonth() + 1}`;
        current.setDate(current.getDate() + 1);
      } else {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        label = `${current.toLocaleString("default", {
          month: "short",
        })} ${current.getFullYear()}`;
        current.setMonth(current.getMonth() + 1);
      }

      data.push({
        date: label,
        revenue: grouped[key] || 0,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching revenue by period:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch revenue data",
    };
  }
}

// Get orders by period (for chart)
export async function getOrdersByPeriod(period: "daily" | "monthly" = "daily") {
  try {
    await checkAdmin();

    const now = new Date();
    let startDate: Date;

    if (period === "daily") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);
    }

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group orders by date
    const grouped: Record<string, number> = {};

    for (const order of orders) {
      const date = order.createdAt;
      let key: string;

      if (period === "daily") {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")}`;
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
      }

      grouped[key] = (grouped[key] || 0) + 1;
    }

    // Convert to array
    const data: { date: string; orders: number }[] = [];
    const current = new Date(startDate);

    while (current <= now) {
      let key: string;
      let label: string;

      if (period === "daily") {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(current.getDate()).padStart(2, "0")}`;
        label = `${current.getDate()}/${current.getMonth() + 1}`;
        current.setDate(current.getDate() + 1);
      } else {
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
          2,
          "0"
        )}`;
        label = `${current.toLocaleString("default", {
          month: "short",
        })} ${current.getFullYear()}`;
        current.setMonth(current.getMonth() + 1);
      }

      data.push({
        date: label,
        orders: grouped[key] || 0,
      });
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching orders by period:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch order data",
    };
  }
}

// Get top selling products
export async function getTopSellingProducts(limit: number = 10) {
  try {
    await checkAdmin();

    // Get order items grouped by product
    const orderItems = await db.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
        price: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: limit,
    });

    // Get product details
    const productIds = orderItems.map((item) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        title: true,
        slug: true,
        images: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    const data = orderItems.map((item) => {
      const product = productMap.get(item.productId);
      return {
        id: item.productId,
        title: product?.title || "Unknown Product",
        slug: product?.slug || "",
        image: product?.images[0] || "/logo.png",
        totalQuantity: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.price || 0) * (item._sum.quantity || 0),
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch top products",
    };
  }
}

// Get sales by city/region
export async function getSalesByCity(limit: number = 10) {
  try {
    await checkAdmin();

    const ordersByCity = await db.order.groupBy({
      by: ["city"],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      where: {
        status: { not: "CANCELLED" },
      },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: limit,
    });

    const data = ordersByCity.map((item) => ({
      city: item.city,
      orders: item._count.id,
      revenue: Number(item._sum.total || 0),
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching sales by city:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch sales by city",
    };
  }
}

// Get payment method statistics
export async function getPaymentMethodStats() {
  try {
    await checkAdmin();

    const ordersByPaymentMethod = await db.order.groupBy({
      by: ["paymentMethod"],
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
      where: {
        status: { not: "CANCELLED" },
      },
    });

    const data = ordersByPaymentMethod.map((item) => ({
      method: item.paymentMethod,
      orders: item._count.id,
      revenue: Number(item._sum.total || 0),
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching payment method stats:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch payment stats",
    };
  }
}

// Get recent activity (last N orders)
export async function getRecentActivity(limit: number = 10) {
  try {
    await checkAdmin();

    const orders = await db.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const data = orders.map((order) => ({
      ...order,
      total: Number(order.total),
    }));

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch recent activity",
    };
  }
}
