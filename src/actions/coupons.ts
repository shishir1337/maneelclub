"use server";

import { db } from "@/lib/db";

/**
 * Validate a coupon code and return discount amount for a given subtotal.
 * Used at checkout (no auth required).
 */
export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<
  | { success: true; discount: number; couponId: string; code: string }
  | { success: false; error: string }
> {
  if (!code?.trim() || subtotal <= 0) {
    return { success: false, error: "Invalid code or subtotal" };
  }

  const coupon = await db.coupon.findFirst({
    where: {
      code: code.trim().toUpperCase(),
      isActive: true,
    },
  });

  if (!coupon) {
    return { success: false, error: "Coupon not found or inactive" };
  }

  const now = new Date();
  if (coupon.validFrom && now < coupon.validFrom) {
    return { success: false, error: "This coupon is not yet valid" };
  }
  if (coupon.validUntil && now > coupon.validUntil) {
    return { success: false, error: "This coupon has expired" };
  }

  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { success: false, error: "This coupon has reached its usage limit" };
  }

  const minOrder = coupon.minOrderAmount != null ? Number(coupon.minOrderAmount) : 0;
  if (subtotal < minOrder) {
    return {
      success: false,
      error: minOrder > 0
        ? `Minimum order amount is ${minOrder.toLocaleString()} BDT`
        : "Invalid subtotal",
    };
  }

  const value = Number(coupon.value);
  let discount: number;
  if (coupon.type === "PERCENT") {
    discount = Math.round((subtotal * value) / 100 * 100) / 100;
  } else {
    discount = Math.min(value, subtotal);
  }

  if (discount <= 0) {
    return { success: false, error: "No discount applies" };
  }

  return {
    success: true,
    discount,
    couponId: coupon.id,
    code: coupon.code,
  };
}
