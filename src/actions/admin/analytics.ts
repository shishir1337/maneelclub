"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { buildChartSeries, resolveChartRange } from "@/lib/analytics-charts";

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
      totalQuantityResult,
      totalQuantityOrderedResult,
      totalQuantityCancelledResult,
      pendingOrders,
      processingOrders,
      deliveredOrders,
      cancelledOrders,
      previousPeriodOrders,
      previousPeriodRevenue,
      previousPeriodQuantityResult,
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
      db.orderItem.aggregate({
        where: {
          order: {
            ...(dateFilter ? dateFilter : {}),
            status: { not: "CANCELLED" },
          },
        },
        _sum: { quantity: true },
      }),
      dateFilter
        ? db.orderItem.aggregate({
            where: { order: dateFilter },
            _sum: { quantity: true },
          })
        : db.orderItem.aggregate({ where: {}, _sum: { quantity: true } }),
      db.orderItem.aggregate({
        where: {
          order: {
            ...(dateFilter ? dateFilter : {}),
            status: "CANCELLED",
          },
        },
        _sum: { quantity: true },
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
      previousFilter
        ? db.orderItem.aggregate({
            where: {
              order: { ...previousFilter, status: { not: "CANCELLED" } },
            },
            _sum: { quantity: true },
          })
        : Promise.resolve({ _sum: { quantity: null } }),
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

    const totalQuantitySold = totalQuantityResult._sum.quantity ?? 0;
    const totalQuantityOrdered = totalQuantityOrderedResult._sum.quantity ?? 0;
    const totalQuantityCancelled = totalQuantityCancelledResult._sum.quantity ?? 0;
    const previousQuantityNum =
      range && previousPeriodQuantityResult?._sum?.quantity != null
        ? previousPeriodQuantityResult._sum.quantity
        : 0;
    const quantityGrowth =
      range && previousQuantityNum > 0
        ? Math.round(((totalQuantitySold - previousQuantityNum) / previousQuantityNum) * 10000) / 100
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
        totalQuantitySold,
        totalQuantityOrdered,
        totalQuantityCancelled,
        thisMonthOrders,
        lastMonthOrders,
        thisMonthRevenue: thisMonthRevenueNum,
        lastMonthRevenue: lastMonthRevenueNum,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        quantityGrowth: range ? quantityGrowth : undefined,
        averageOrderValue,
        cancellationRate,
        newCustomers: typeof newCustomers === "number" ? newCustomers : 0,
        previousPeriodRevenue: range ? previousRevenueNum : undefined,
        previousPeriodOrders: range && typeof previousPeriodOrders === "number" ? previousPeriodOrders : undefined,
        previousPeriodQuantitySold: range ? previousQuantityNum : undefined,
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

/**
 * All three chart series from ONE query (previously each chart loaded the same orders separately).
 * Revenue excludes cancelled orders; order counts and the status breakdown include them.
 */
async function loadChartSeries(
  period: "daily" | "monthly",
  dateFrom?: string | null,
  dateTo?: string | null
) {
  const range = resolveChartRange(period, parseDateRange(dateFrom ?? undefined, dateTo ?? undefined), new Date());
  const rows = await db.order.findMany({
    where: { createdAt: { gte: range.startDate, lte: range.endDate } },
    select: { createdAt: true, total: true, status: true },
  });
  return buildChartSeries(
    rows.map((r) => ({ createdAt: r.createdAt, total: Number(r.total), status: r.status })),
    range
  );
}

// Get revenue by period (daily or monthly). With dateFrom/dateTo, uses that range and picks grouping by length (<=31 days = daily).
export async function getRevenueByPeriod(
  period: "daily" | "monthly" = "daily",
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();
    return { success: true, data: (await loadChartSeries(period, dateFrom, dateTo)).revenue };
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
    return { success: true, data: (await loadChartSeries(period, dateFrom, dateTo)).orders };
  } catch (error) {
    console.error("Error fetching orders by period:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch order data",
    };
  }
}

// Get orders by status over time (stacked chart). Optional dateFrom/dateTo; grouping by day if <=31 days else by month.
export async function getOrdersByStatusOverTime(
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();
    return { success: true, data: (await loadChartSeries("daily", dateFrom, dateTo)).statusOverTime };
  } catch (error) {
    console.error("Error fetching orders by status over time:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch order status data",
    };
  }
}

// Product-wise report: units sold and revenue per product in date range. Excludes CANCELLED orders.
export async function getTopSellingProducts(
  limit: number = 10,
  dateRange: { dateFrom: string; dateTo: string } | null
) {
  try {
    await checkAdmin();

    const dateFrom = dateRange?.dateFrom ?? null;
    const dateTo = dateRange?.dateTo ?? null;
    const range = parseDateRange(dateFrom, dateTo);
    if (!range) return { success: true, data: [] };

    // Summed in the database with a join, instead of loading every order id and item into the app
    // (which took seconds for long ranges). Parameterised: no user input is concatenated.
    const grouped = await db.$queryRaw<Array<{ productId: string; totalQuantity: bigint; totalRevenue: unknown }>>`
      SELECT oi."productId" AS "productId",
             SUM(oi."quantity") AS "totalQuantity",
             SUM(oi."price" * oi."quantity") AS "totalRevenue"
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      WHERE o."createdAt" >= ${range.start}
        AND o."createdAt" <= ${range.end}
        AND o."status" <> 'CANCELLED'
      GROUP BY oi."productId"
      ORDER BY SUM(oi."quantity") DESC, oi."productId" ASC
      LIMIT ${limit}
    `;
    if (grouped.length === 0) return { success: true, data: [] };

    const sorted: Array<[string, { totalQuantity: number; totalRevenue: number }]> = grouped.map((g) => [
      g.productId,
      { totalQuantity: Number(g.totalQuantity), totalRevenue: Number(g.totalRevenue) },
    ]);

    const productIds = sorted.map(([id]) => id);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, slug: true, images: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const data = sorted.map(([productId, agg]) => {
      const product = productMap.get(productId);
      return {
        id: productId,
        title: product?.title ?? "Unknown Product",
        slug: product?.slug ?? "",
        image: product?.images?.[0] ?? "/logo.png",
        totalQuantity: agg.totalQuantity,
        totalRevenue: Math.round(agg.totalRevenue * 100) / 100,
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

/**
 * Orders, revenue and AOV grouped by traffic source.
 * Orders placed before attribution shipped have a null channel and group as "unknown".
 */
export async function getOrdersBySource(
  dateFrom?: string | null,
  dateTo?: string | null
) {
  try {
    await checkAdmin();

    const range = parseDateRange(dateFrom ?? undefined, dateTo ?? undefined);
    const dateWhere = range ? { createdAt: { gte: range.start, lte: range.end } } : undefined;

    const grouped = await db.order.groupBy({
      by: ["sourceChannel"],
      _count: { id: true },
      _sum: { total: true },
      where: {
        status: { not: "CANCELLED" },
        ...dateWhere,
      },
      orderBy: { _sum: { total: "desc" } },
    });

    const data = grouped.map((item) => {
      const orders = item._count.id;
      const revenue = Number(item._sum.total || 0);
      return {
        channel: item.sourceChannel ?? "unknown",
        orders,
        revenue,
        aov: orders > 0 ? revenue / orders : 0,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching orders by source:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch orders by source",
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

/**
 * Everything the Analytics page shows, in ONE request. Next.js runs server actions from the
 * browser one at a time, so the page's nine separate calls queued behind each other; here they
 * run in parallel on the server. Each part keeps its own success/error, as before.
 */
export async function getAnalyticsDashboard(dateFrom: string, dateTo: string) {
  try {
    await checkAdmin();
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : "Unauthorized" };
  }

  const [overview, topProducts, cities, sources, payments, recent, charts] = await Promise.all([
    getAnalyticsOverview(dateFrom, dateTo),
    getTopSellingProducts(10, { dateFrom, dateTo }),
    getSalesByCity(100, dateFrom, dateTo),
    getOrdersBySource(dateFrom, dateTo),
    getPaymentMethodStats(dateFrom, dateTo),
    getRecentActivity(5, dateFrom, dateTo),
    loadChartSeries("daily", dateFrom, dateTo)
      .then((data) => ({ success: true as const, data }))
      .catch((error: unknown) => {
        console.error("Error fetching analytics charts:", error);
        return { success: false as const, data: null };
      }),
  ]);

  return {
    success: true as const,
    data: { overview, topProducts, cities, sources, payments, recent, charts },
  };
}
