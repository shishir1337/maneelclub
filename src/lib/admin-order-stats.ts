/** Pure helpers for admin order lists (unit tested; no database access). */

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
export type OrderStatusKey = (typeof ORDER_STATUSES)[number];

type Contact = { customerPhone: string; customerEmail: string | null };

/**
 * "Times purchased" for each order on a page: how many orders share its phone or email.
 * Same rule as the old per-row query, but computed from one fetched history list.
 */
export function countPurchasesByCustomer(
  pageOrders: Array<Contact & { id: string }>,
  history: Contact[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const order of pageOrders) {
    result[order.id] = history.filter(
      (h) =>
        h.customerPhone === order.customerPhone ||
        (order.customerEmail != null && order.customerEmail !== "" && h.customerEmail === order.customerEmail)
    ).length;
  }
  return result;
}

/** Turn a groupBy(status) result into counts for every status tab plus "all". */
export function statusCountsFromGroups(
  groups: Array<{ status: string; _count: { _all: number } }>
): Record<OrderStatusKey | "all", number> {
  const counts = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatusKey, number>;
  let all = 0;
  for (const g of groups) {
    if ((ORDER_STATUSES as readonly string[]).includes(g.status)) {
      counts[g.status as OrderStatusKey] = g._count._all;
    }
    all += g._count._all;
  }
  return { all, ...counts };
}
