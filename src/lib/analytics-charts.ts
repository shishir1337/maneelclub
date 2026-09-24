/**
 * Chart series for Admin → Analytics, built from ONE list of orders instead of three queries.
 * Date keys and labels use the same local-time logic the separate functions used before.
 */

export const CHART_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type ChartStatus = (typeof CHART_STATUSES)[number];

export type ChartOrder = { createdAt: Date; total: number; status: string };

export interface ChartRange {
  startDate: Date;
  endDate: Date;
  useDaily: boolean;
}

/**
 * With a date range: that range, daily when 31 days or fewer, otherwise monthly.
 * Without one: the last 30 days daily ("daily") or the last 12 months ("monthly").
 */
export function resolveChartRange(
  period: "daily" | "monthly",
  range: { start: Date; end: Date } | null,
  now: Date
): ChartRange {
  if (range) {
    const days = Math.round((range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    return { startDate: range.start, endDate: range.end, useDaily: days <= 31 };
  }
  const startDate = new Date(now);
  if (period === "daily") startDate.setDate(startDate.getDate() - 30);
  else startDate.setMonth(startDate.getMonth() - 12);
  return { startDate, endDate: now, useDaily: period === "daily" };
}

function bucketKey(date: Date, useDaily: boolean): string {
  return useDaily
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function bucketLabel(date: Date, useDaily: boolean): string {
  return useDaily
    ? `${date.getDate()}/${date.getMonth() + 1}`
    : `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`;
}

const emptyStatusRow = (): Record<ChartStatus, number> => ({
  PENDING: 0,
  CONFIRMED: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  DELIVERED: 0,
  CANCELLED: 0,
});

/**
 * Revenue excludes cancelled orders (as before); order counts and the status chart include all.
 * Every day or month in the range gets a point, zero when there were no orders.
 */
export function buildChartSeries(orders: ChartOrder[], { startDate, endDate, useDaily }: ChartRange) {
  const revenueByKey: Record<string, number> = {};
  const ordersByKey: Record<string, number> = {};
  const statusByKey: Record<string, Record<ChartStatus, number>> = {};

  for (const order of orders) {
    const key = bucketKey(order.createdAt, useDaily);
    ordersByKey[key] = (ordersByKey[key] || 0) + 1;
    if (order.status !== "CANCELLED") revenueByKey[key] = (revenueByKey[key] || 0) + order.total;
    if (!statusByKey[key]) statusByKey[key] = emptyStatusRow();
    if ((CHART_STATUSES as readonly string[]).includes(order.status)) {
      statusByKey[key][order.status as ChartStatus] += 1;
    }
  }

  const revenue: { date: string; revenue: number }[] = [];
  const orderCounts: { date: string; orders: number }[] = [];
  const statusOverTime: ({ date: string } & Record<ChartStatus, number>)[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = bucketKey(current, useDaily);
    const label = bucketLabel(current, useDaily);
    revenue.push({ date: label, revenue: revenueByKey[key] || 0 });
    orderCounts.push({ date: label, orders: ordersByKey[key] || 0 });
    statusOverTime.push({ date: label, ...(statusByKey[key] ?? emptyStatusRow()) });
    if (useDaily) current.setDate(current.getDate() + 1);
    else current.setMonth(current.getMonth() + 1);
  }

  return { revenue, orders: orderCounts, statusOverTime };
}
