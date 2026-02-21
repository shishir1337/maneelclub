import { z } from "zod";

export const couponTypeValues = ["PERCENT", "FIXED"] as const;
export type CouponType = (typeof couponTypeValues)[number];

const baseCouponSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code is too long")
    .transform((s) => s.trim().toUpperCase()),
  type: z.enum(couponTypeValues),
  value: z.coerce.number().positive("Value must be positive"),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().min(1).optional().nullable(),
  validFrom: z.string().optional().nullable().transform((s) => (s && s.trim() ? s : undefined)),
  validUntil: z.string().optional().nullable().transform((s) => (s && s.trim() ? s : undefined)),
  isActive: z.boolean().default(true),
});

export const createCouponSchema = baseCouponSchema.refine(
  (data) => {
    if (data.type === "PERCENT") return data.value <= 100;
    return true;
  },
  { message: "Percentage must be between 1 and 100", path: ["value"] }
);

export const updateCouponSchema = baseCouponSchema.partial().refine(
  (data) => {
    if (data.type === "PERCENT" && data.value != null) return data.value <= 100;
    return true;
  },
  { message: "Percentage must be between 1 and 100", path: ["value"] }
);

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
