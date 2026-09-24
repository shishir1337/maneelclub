/**
 * Order pricing shared by the checkout display (client) and createOrder (server), so the price
 * shown is always the price charged. Pure: no database access.
 *
 * Rules:
 *  - Delivery is the zone rate, free at or above the site-wide free-shipping minimum (0 = off).
 *  - Automatic offers ("spend X, get Y") apply without a code. When several qualify, the one that
 *    saves the customer the most wins (discount plus any delivery it makes free).
 *  - A customer's coupon code and an automatic offer never stack: the bigger saving wins,
 *    and the code wins a tie.
 */

export type DiscountType = "PERCENT" | "FIXED";

/** An automatic offer, with Decimal fields already converted to numbers. */
export interface Promotion {
  id: string;
  /** Shown to customers, e.g. "Eid offer". */
  name: string;
  type: DiscountType;
  value: number;
  minOrderAmount: number;
  /** Cap for percentage offers; null means no cap. */
  maxDiscount: number | null;
  freeShipping: boolean;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
}

/** A coupon code that the server has already validated for this subtotal. */
export interface AppliedCoupon {
  couponId: string;
  code: string;
  discount: number;
}

export type AppliedDiscount =
  | { kind: "coupon"; couponId: string; code: string }
  | { kind: "promotion"; promotionId: string; name: string; freeShipping: boolean };

export interface OrderPricing {
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  applied: AppliedDiscount | null;
}

const roundMoney = (n: number) => Math.round(n * 100) / 100;

export function isPromotionLive(p: Promotion, now: Date): boolean {
  return (
    p.isActive &&
    (!p.startsAt || now >= new Date(p.startsAt)) &&
    (!p.endsAt || now <= new Date(p.endsAt))
  );
}

/** Money off the subtotal for an offer (ignores its minimum). */
export function promotionDiscount(p: Promotion, subtotal: number): number {
  if (p.type === "PERCENT") {
    const raw = roundMoney((subtotal * p.value) / 100);
    return p.maxDiscount != null && p.maxDiscount > 0 ? Math.min(raw, p.maxDiscount) : raw;
  }
  return Math.min(p.value, subtotal);
}

export function computeOrderPricing(input: {
  subtotal: number;
  zoneRate: number;
  freeShippingMinimum: number;
  coupon: AppliedCoupon | null;
  promotions: Promotion[];
  now: Date;
}): OrderPricing {
  const { subtotal, zoneRate, freeShippingMinimum, coupon, promotions, now } = input;
  const baseShipping = freeShippingMinimum > 0 && subtotal >= freeShippingMinimum ? 0 : zoneRate;

  // Best qualifying automatic offer, by total saving.
  let bestPromotion: { promotion: Promotion; discount: number; saving: number } | null = null;
  for (const promotion of promotions) {
    if (!isPromotionLive(promotion, now) || subtotal < promotion.minOrderAmount) continue;
    const discount = promotionDiscount(promotion, subtotal);
    const saving = discount + (promotion.freeShipping ? baseShipping : 0);
    if (saving > 0 && (!bestPromotion || saving > bestPromotion.saving)) {
      bestPromotion = { promotion, discount, saving };
    }
  }

  const couponSaving = coupon && coupon.discount > 0 ? coupon.discount : 0;
  const useCoupon = coupon != null && couponSaving > 0 && couponSaving >= (bestPromotion?.saving ?? 0);

  let discount = 0;
  let shippingCost = baseShipping;
  let applied: AppliedDiscount | null = null;

  if (useCoupon) {
    discount = coupon.discount;
    applied = { kind: "coupon", couponId: coupon.couponId, code: coupon.code };
  } else if (bestPromotion) {
    discount = bestPromotion.discount;
    if (bestPromotion.promotion.freeShipping) shippingCost = 0;
    applied = {
      kind: "promotion",
      promotionId: bestPromotion.promotion.id,
      name: bestPromotion.promotion.name,
      freeShipping: bestPromotion.promotion.freeShipping,
    };
  }

  return {
    subtotal,
    discount,
    shippingCost,
    total: Math.max(0, subtotal - discount + shippingCost),
    applied,
  };
}

/** The nearest live offer the cart has not reached yet, for "add ৳X more" nudges. */
export function findNextPromotion(
  promotions: Promotion[],
  subtotal: number,
  now: Date
): { promotion: Promotion; amountNeeded: number } | null {
  const upcoming = promotions
    .filter((p) => isPromotionLive(p, now) && p.minOrderAmount > subtotal)
    .sort((a, b) => a.minOrderAmount - b.minOrderAmount);
  const next = upcoming[0];
  return next ? { promotion: next, amountNeeded: roundMoney(next.minOrderAmount - subtotal) } : null;
}

/**
 * Short customer-facing description, e.g. "10% off (up to BDT 500) + free delivery".
 * `money` is the store's price formatter so amounts match the rest of the site.
 */
export function describePromotion(
  p: Pick<Promotion, "type" | "value" | "maxDiscount" | "freeShipping">,
  money: (amount: number) => string
): string {
  const off =
    p.value > 0
      ? p.type === "PERCENT"
        ? `${p.value}% off${p.maxDiscount ? ` (up to ${money(p.maxDiscount)})` : ""}`
        : `${money(p.value)} off`
      : "";
  if (off && p.freeShipping) return `${off} + free delivery`;
  return off || (p.freeShipping ? "Free delivery" : "");
}
