"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrderStats, getRecentOrders } from "@/actions/admin/orders";
import { getCustomerStats } from "@/actions/admin/customers";

/**
 * Everything the admin dashboard shows, in ONE request. Previously the page made four browser
 * requests that Next.js ran one after another, one of which downloaded the whole product catalogue
 * with all variants just to count it.
 */
export async function getAdminDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false as const, error: "Unauthorized: Admin access required" };
  }

  const [orderStats, recentOrders, productCount, customerStats] = await Promise.all([
    getOrderStats(),
    getRecentOrders(5),
    // Same number the page showed before: every product, active or not.
    db.product.count().catch((error: unknown) => {
      console.error("Error counting products:", error);
      return 0;
    }),
    getCustomerStats(),
  ]);

  return { success: true as const, data: { orderStats, recentOrders, productCount, customerStats } };
}
