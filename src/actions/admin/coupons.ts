"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createCouponSchema, updateCouponSchema, type CreateCouponInput, type UpdateCouponInput } from "@/schemas/coupon";

async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  usedCount: number;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  createdAt: Date;
};

export async function getAdminCoupons(): Promise<CouponRow[]> {
  await checkAdmin();
  const list = await db.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });
  return list.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    minOrderAmount: c.minOrderAmount != null ? Number(c.minOrderAmount) : null,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    validFrom: c.validFrom,
    validUntil: c.validUntil,
    isActive: c.isActive,
    createdAt: c.createdAt,
  }));
}

export async function getAdminCoupon(id: string) {
  await checkAdmin();
  const coupon = await db.coupon.findUnique({
    where: { id },
  });
  if (!coupon) return null;
  return {
    id: coupon.id,
    code: coupon.code,
    type: coupon.type,
    value: Number(coupon.value),
    minOrderAmount: coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : null,
    maxUses: coupon.maxUses,
    usedCount: coupon.usedCount,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    isActive: coupon.isActive,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt,
  };
}

export async function createCoupon(
  input: CreateCouponInput
): Promise<{ success: true; data: { id: string } } | { success: false; error: string }> {
  await checkAdmin();
  const parsed = createCouponSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const existing = await db.coupon.findUnique({
    where: { code: data.code },
  });
  if (existing) {
    return { success: false, error: "A coupon with this code already exists" };
  }
  const coupon = await db.coupon.create({
    data: {
      code: data.code,
      type: data.type,
      value: data.value,
      minOrderAmount: data.minOrderAmount ?? undefined,
      maxUses: data.maxUses ?? undefined,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      isActive: data.isActive,
    },
  });
  revalidatePath("/admin/coupons");
  return { success: true, data: { id: coupon.id } };
}

export async function updateCoupon(
  id: string,
  input: UpdateCouponInput
): Promise<{ success: true } | { success: false; error: string }> {
  await checkAdmin();
  const parsed = updateCouponSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  if (data.code != null) {
    const existing = await db.coupon.findFirst({
      where: { code: data.code, NOT: { id } },
    });
    if (existing) {
      return { success: false, error: "A coupon with this code already exists" };
    }
  }
  await db.coupon.update({
    where: { id },
    data: {
      ...(data.code != null && { code: data.code }),
      ...(data.type != null && { type: data.type }),
      ...(data.value != null && { value: data.value }),
      ...(data.minOrderAmount !== undefined && { minOrderAmount: data.minOrderAmount ?? null }),
      ...(data.maxUses !== undefined && { maxUses: data.maxUses ?? null }),
      ...(data.validFrom !== undefined && { validFrom: data.validFrom ? new Date(data.validFrom) : null }),
      ...(data.validUntil !== undefined && { validUntil: data.validUntil ? new Date(data.validUntil) : null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function deleteCoupon(id: string): Promise<{ success: true } | { success: false; error: string }> {
  await checkAdmin();
  try {
    await db.coupon.delete({ where: { id } });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Failed to delete" };
  }
}
