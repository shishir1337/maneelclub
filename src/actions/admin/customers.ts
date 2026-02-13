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

// Get all customers with order stats
export async function getAdminCustomers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    await checkAdmin();

    const where: any = {};

    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
          banned: true,
          banReason: true,
          banExpires: true,
          _count: {
            select: { orders: true },
          },
          orders: {
            select: {
              total: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      db.user.count({ where }),
    ]);

    // Calculate total spent per customer
    const customersWithStats = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      role: customer.role,
      banned: customer.banned ?? false,
      banReason: customer.banReason ?? null,
      banExpires: customer.banExpires ?? null,
      orderCount: customer._count.orders,
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.total), 0),
    }));

    return { success: true, data: { customers: customersWithStats, total } };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch customers" 
    };
  }
}

// Get single customer by ID
export async function getCustomerById(id: string) {
  try {
    await checkAdmin();

    const customer = await db.user.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            items: true,
          },
          orderBy: { createdAt: "desc" },
        },
        addresses: true,
      },
    });

    if (!customer) {
      return { success: false, error: "Customer not found" };
    }

    return { success: true, data: customer };
  } catch (error) {
    console.error("Error fetching customer:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch customer" 
    };
  }
}

// Ban user (Better Auth admin plugin)
export async function banUser(
  userId: string,
  options?: { banReason?: string; banExpiresIn?: number }
) {
  try {
    await checkAdmin();

    await auth.api.banUser({
      body: {
        userId,
        banReason: options?.banReason,
        banExpiresIn: options?.banExpiresIn,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error banning user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to ban user",
    };
  }
}

// Unban user (Better Auth admin plugin)
export async function unbanUser(userId: string) {
  try {
    await checkAdmin();

    await auth.api.unbanUser({
      body: { userId },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error unbanning user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unban user",
    };
  }
}

// Get customer statistics
export async function getCustomerStats() {
  try {
    await checkAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalCustomers,
      thisMonthCustomers,
      lastMonthCustomers,
      customersWithOrders,
    ] = await Promise.all([
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: startOfMonth },
        },
      }),
      db.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      db.user.count({
        where: {
          role: "CUSTOMER",
          orders: { some: {} },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalCustomers,
        thisMonthCustomers,
        lastMonthCustomers,
        customersWithOrders,
        conversionRate: totalCustomers > 0 
          ? Math.round((customersWithOrders / totalCustomers) * 100) 
          : 0,
      },
    };
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch statistics" 
    };
  }
}
