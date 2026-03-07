"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";

const REASONS = [
  "ORDER_CREATED",
  "ORDER_CANCELLED",
  "ORDER_DELETED",
  "PAYMENT_REJECTED",
  "MANUAL_EDIT",
  "ORDER_REACTIVATED",
] as const;

export type StockMovementReason = (typeof REASONS)[number];

export interface StockMovementRow {
  id: string;
  productId: string;
  variantId: string | null;
  delta: number;
  reason: string;
  orderId: string | null;
  orderNumber: string | null;
  createdAt: Date;
  productTitle: string;
  productSlug: string;
}

export interface GetStockMovementsParams {
  productId?: string;
  orderNumber?: string;
  reason?: StockMovementReason;
  fromDate?: string; // ISO date
  toDate?: string;   // ISO date
  limit?: number;
  offset?: number;
}

export async function getStockMovements(
  params: GetStockMovementsParams = {}
): Promise<
  | { success: true; data: { movements: StockMovementRow[]; total: number } }
  | { success: false; error: string }
> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" };
    }

    const { productId, orderNumber, reason, fromDate, toDate, limit = 50, offset = 0 } = params;

    const where: Prisma.StockMovementWhereInput = {};

    if (productId) where.productId = productId;
    if (orderNumber) where.orderNumber = { contains: orderNumber, mode: "insensitive" };
    if (reason) where.reason = reason;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        where.createdAt.lte = d;
      }
    }

    const [movements, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        include: {
          product: { select: { title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      db.stockMovement.count({ where }),
    ]);

    const rows: StockMovementRow[] = movements.map((m) => ({
      id: m.id,
      productId: m.productId,
      variantId: m.variantId,
      delta: m.delta,
      reason: m.reason,
      orderId: m.orderId,
      orderNumber: m.orderNumber,
      createdAt: m.createdAt,
      productTitle: m.product.title,
      productSlug: m.product.slug,
    }));

    return { success: true, data: { movements: rows, total } };
  } catch (e) {
    console.error("getStockMovements:", e);
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to load stock movements",
    };
  }
}
