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

/** Parse ISO date strings (YYYY-MM-DD or full ISO) to start-of-day and end-of-day UTC. Returns null if invalid or missing. */
function parseDateRange(
  dateFrom?: string | null,
  dateTo?: string | null
): { start: Date; end: Date } | null {
  if (!dateFrom || !dateTo) return null;
  const from = dateFrom.includes("T") ? new Date(dateFrom) : new Date(dateFrom + "T00:00:00.000Z");
  const to = dateTo.includes("T") ? new Date(dateTo) : new Date(dateTo + "T23:59:59.999Z");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
  const start = new Date(from);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

// Get overview statistics (optionally scoped to dateFrom/dateTo; when provided, growth is vs previous period of same length)
export async function getAnalyticsOverview(dateFrom?: string | null, dateTo?: string | null) {
  try {
    await checkAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    const dateFilter = range
      ? { createdAt: { gte: range.start, lte: range.end } as { gte: Date; lte: Date } }
      : undefined;

    // Previous period for growth when range is set (same length, ending just before range.start)
    let previousRange: { start: Date; end: Date } | null = null;
    if (range) {
      const ms = range.end.getTime() - range.start.getTime() + 1;
      previousRange = {
        end: new Date(range.start.getTime() - 1),
        start: new Date(range.start.getTime() - ms),
      };
    }
    const previousFilter =
      previousRange &&
      ({
        createdAt: { gte: previousRange.start, lte: previousRange.end },
      } as { createdAt: { gte: Date; lte: Date } });

    const [
      totalOrders,
      totalProducts,
      totalCustomers,
      newCustomers,
      thisMonthOrders,
      lastMonthOrders,
      thisMonthRevenue,
      lastMonthRevenue,
      totalRevenue,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      previousPeriodOrders,
      previousPeriodRevenue,
    ] = await Promise.all([
      db.order.count(dateFilter ? { where: dateFilter } : undefined),
      db.product.count({ where: { isActive: true } }),
      db.user.count({ where: { role: "CUSTOMER" } }),
      dateFilter
        ? db.user.count({
            where: { role: "CUSTOMER", createdAt: dateFilter.createdAt },
          })
        : Promise.resolve(0),
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
        where: dateFilter
          ? { ...dateFilter, status: { not: "CANCELLED" } }
          : { status: { not: "CANCELLED" } },
        _sum: { total: true },
      }),
      db.order.count({
        where: dateFilter ? { ...dateFilter, status: "PENDING" } : { status: "PENDING" },
      }),
      db.order.count({
        where: dateFilter ? { ...dateFilter, status: "PROCESSING" } : { status: "PROCESSING" },
      }),
      db.order.count({
        where: dateFilter ? { ...dateFilter, status: "DELIVERED" } : { status: "DELIVERED" },
      }),
      db.order.count({
        where: dateFilter ? { ...dateFilter, status: "CANCELLED" } : { status: "CANCELLED" },
      }),
      previousFilter
        ? db.order.count({ where: previousFilter })
        : Promise.resolve(0),
      previousFilter
        ? db.order.aggregate({
            where: { ...previousFilter, status: { not: "CANCELLED" } },
            _sum: { total: true },
          })
        : Promise.resolve({ _sum: { total: null } }),
    ]);

    const totalRevenueNum = Number(totalRevenue._sum.total || 0);
    const thisMonthRevenueNum = Number(thisMonthRevenue._sum.total || 0);
    const lastMonthRevenueNum = Number(lastMonthRevenue._sum.total || 0);
    const previousRevenueNum = range
      ? Number(previousPeriodRevenue?._sum?.total ?? 0)
      : lastMonthRevenueNum;
    const previousOrdersNum =
      range && typeof previousPeriodOrders === "number"
        ? previousPeriodOrders
        : lastMonthOrders;

    const revenueGrowth = range
      ? previousRevenueNum > 0
        ? ((totalRevenueNum - previousRevenueNum) / previousRevenueNum) * 100
        : 0
      : lastMonthRevenueNum > 0
        ? ((thisMonthRevenueNum - lastMonthRevenueNum) / lastMonthRevenueNum) * 100
        : 0;

    const orderGrowth = range
      ? previousOrdersNum > 0
        ? ((totalOrders - previousOrdersNum) / previousOrdersNum) * 100
        : 0
      : lastMonthOrders > 0
        ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100
        : 0;

    const averageOrderValue =
      totalOrders > 0 ? Math.round((totalRevenueNum / totalOrders) * 100) / 100 : 0;
    const cancellationRate =
      totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 10000) / 100 : 0;

    return {
      success: true,
      data: {
        totalOrders,
        totalProducts,
        totalCustomers,
        totalRevenue: totalRevenueNum,
        thisMonthOrders,
        lastMonthOrders,
        thisMonthRevenue: thisMonthRevenueNum,
        lastMonthRevenue: lastMonthRevenueNum,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        averageOrderValue,
        cancellationRate,
        newCustomers: typeof newCustomers === "number" ? newCustomers : 0,
        previousPeriodRevenue: range ? previousRevenueNum : undefined,
        previousPeriodOrders: range && typeof previousPeriodOrders === "number" ? previousPeriodOrders : undefined,
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

// Get revenue by period (daily or monthly). With dateFrom/dateTo, uses that range and picks grouping by length (<=31 days = daily).
export async function getRevenueByPeriod(
  period: "daily" | "monthly" = "daily",
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let useDaily: boolean;

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    if (range) {
      startDate = range.start;
      endDate = range.end;
      const days = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      useDaily = days <= 31;
    } else {
      useDaily = period === "daily";
      if (useDaily) {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        endDate = now;
      } else {
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 12);
        endDate = now;
      }
    }

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: { not: "CANCELLED" },
      },
      select: {
        total: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const grouped: Record<string, number> = {};
    for (const order of orders) {
      const date = order.createdAt;
      const key = useDaily
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      grouped[key] = (grouped[key] || 0) + Number(order.total);
    }

    const data: { date: string; revenue: number }[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const key = useDaily
        ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
        : `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      const label = useDaily
        ? `${current.getDate()}/${current.getMonth() + 1}`
        : `${current.toLocaleString("default", { month: "short" })} ${current.getFullYear()}`;
      data.push({ date: label, revenue: grouped[key] || 0 });
      if (useDaily) current.setDate(current.getDate() + 1);
      else current.setMonth(current.getMonth() + 1);
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

// Get orders by period (for chart). With dateFrom/dateTo, uses that range and picks grouping by length (<=31 days = daily).
export async function getOrdersByPeriod(
  period: "daily" | "monthly" = "daily",
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let useDaily: boolean;

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    if (range) {
      startDate = range.start;
      endDate = range.end;
      const days = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      useDaily = days <= 31;
    } else {
      useDaily = period === "daily";
      if (useDaily) {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 30);
        endDate = now;
      } else {
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 12);
        endDate = now;
      }
    }

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const grouped: Record<string, number> = {};
    for (const order of orders) {
      const date = order.createdAt;
      const key = useDaily
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      grouped[key] = (grouped[key] || 0) + 1;
    }

    const data: { date: string; orders: number }[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const key = useDaily
        ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
        : `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      const label = useDaily
        ? `${current.getDate()}/${current.getMonth() + 1}`
        : `${current.toLocaleString("default", { month: "short" })} ${current.getFullYear()}`;
      data.push({ date: label, orders: grouped[key] || 0 });
      if (useDaily) current.setDate(current.getDate() + 1);
      else current.setMonth(current.getMonth() + 1);
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

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

// Get orders by status over time (stacked chart). Optional dateFrom/dateTo; grouping by day if <=31 days else by month.
export async function getOrdersByStatusOverTime(
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let useDaily: boolean;

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    if (range) {
      startDate = range.start;
      endDate = range.end;
      const days = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      useDaily = days <= 31;
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      endDate = now;
      useDaily = true;
    }

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    });

    type StatusKey = (typeof ORDER_STATUSES)[number];
    const grouped: Record<string, Record<StatusKey, number>> = {};

    for (const order of orders) {
      const date = order.createdAt;
      const key = useDaily
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) {
        grouped[key] = { PENDING: 0, CONFIRMED: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
      }
      const status = order.status as StatusKey;
      if (ORDER_STATUSES.includes(status)) {
        grouped[key][status] += 1;
      }
    }

    const data: ({ date: string } & Record<StatusKey, number>)[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const key = useDaily
        ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`
        : `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      const label = useDaily
        ? `${current.getDate()}/${current.getMonth() + 1}`
        : `${current.toLocaleString("default", { month: "short" })} ${current.getFullYear()}`;
      const row = grouped[key] ?? { PENDING: 0, CONFIRMED: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
      data.push({ date: label, ...row });
      if (useDaily) current.setDate(current.getDate() + 1);
      else current.setMonth(current.getMonth() + 1);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching orders by status over time:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch order status data",
    };
  }
}

// Get top selling products (optionally scoped to dateFrom/dateTo)
export async function getTopSellingProducts(
  limit: number = 10,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    let orderIds: string[] | undefined;
    if (range) {
      const orders = await db.order.findMany({
        where: { createdAt: { gte: range.start, lte: range.end } },
        select: { id: true },
      });
      orderIds = orders.map((o) => o.id);
      if (orderIds.length === 0) return { success: true, data: [] };
    }

    const orderItems = await db.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, price: true },
      ...(orderIds ? { where: { orderId: { in: orderIds } } } : {}),
      orderBy: { _sum: { quantity: "desc" } },
      take: limit,
    });

    const productIds = orderItems.map((item) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, slug: true, images: true },
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

// Get sales by city/region (optionally scoped to dateFrom/dateTo)
export async function getSalesByCity(
  limit: number = 10,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    const dateWhere = range ? { createdAt: { gte: range.start, lte: range.end } } : undefined;

    const ordersByCity = await db.order.groupBy({
      by: ["city"],
      _count: { id: true },
      _sum: { total: true },
      where: {
        status: { not: "CANCELLED" },
        ...dateWhere,
      },
      orderBy: { _sum: { total: "desc" } },
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

// Get payment method statistics (optionally scoped to dateFrom/dateTo)
export async function getPaymentMethodStats(
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    const dateWhere = range ? { createdAt: { gte: range.start, lte: range.end } } : undefined;

    const ordersByPaymentMethod = await db.order.groupBy({
      by: ["paymentMethod"],
      _count: { id: true },
      _sum: { total: true },
      where: {
        status: { not: "CANCELLED" },
        ...dateWhere,
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

// Get recent activity (last N orders; optionally scoped to dateFrom/dateTo)
export async function getRecentActivity(
  limit: number = 10,
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    const dateWhere = range ? { createdAt: { gte: range.start, lte: range.end } } : undefined;

    const orders = await db.order.findMany({
      where: dateWhere,
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
