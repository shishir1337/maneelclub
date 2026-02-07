import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

const paymentMethodValues = PAYMENT_METHODS.map((p) => p.value) as [string, ...string[]];

// Shipping zone: inside Dhaka City Corporation or outside
export const SHIPPING_ZONE_VALUES = ["inside_dhaka", "outside_dhaka"] as const;
export type ShippingZone = (typeof SHIPPING_ZONE_VALUES)[number];

// Base checkout schema without payment
const baseCheckoutSchema = z.object({
  // Contact Information
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  
  email: z
    .string()
    .email("Please enter a valid email")
    .optional()
    .or(z.literal("")),
  
  phone: z
    .string()
    .min(11, "Phone number must be at least 11 digits")
    .max(14, "Phone number is too long")
    .regex(/^[0-9+]+$/, "Please enter a valid phone number"),
  
  // Shipping Address
  address: z
    .string()
    .min(10, "Please enter a detailed address")
    .max(500, "Address is too long"),
  
  // Area / City (free text, e.g. Dhanmondi, Mirpur, Savar)
  city: z
    .string()
    .min(2, "Please enter your area or city")
    .max(100, "Area/City is too long"),
  
  // Which shipping rate applies (from admin settings)
  shippingZone: z.enum(SHIPPING_ZONE_VALUES, {
    message: "Please select shipping area",
  }),
  
  altPhone: z
    .string()
    .regex(/^[0-9+]*$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  
  deliveryNote: z
    .string()
    .max(500, "Note is too long")
    .optional(),
  
  // Payment Information
  paymentMethod: z.enum(paymentMethodValues as [string, ...string[]], {
    error: "Please select a payment method",
  }),
  
  // Mobile payment fields (optional at base level, validated conditionally)
  senderNumber: z
    .string()
    .regex(/^01[3-9][0-9]{8}$/, "Please enter a valid 11-digit BD mobile number")
    .optional()
    .or(z.literal("")),
  
  transactionId: z
    .string()
    .min(4, "Transaction ID must be at least 4 characters")
    .max(50, "Transaction ID is too long")
    .optional()
    .or(z.literal("")),
});

// Checkout schema with conditional validation for mobile payments
export const checkoutSchema = baseCheckoutSchema.superRefine((data, ctx) => {
  // If payment method is not COD, require sender number and transaction ID
  if (data.paymentMethod !== "COD") {
    if (!data.senderNumber || data.senderNumber === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter your mobile number used for payment",
        path: ["senderNumber"],
      });
    }
    if (!data.transactionId || data.transactionId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter the transaction ID",
        path: ["transactionId"],
      });
    }
  }
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Schema for guest checkout (same as above but explicit)
export const guestCheckoutSchema = checkoutSchema;

// Schema for logged-in user checkout (can use saved address)
export const userCheckoutSchema = baseCheckoutSchema.extend({
  usesSavedAddress: z.boolean().optional(),
  savedAddressId: z.string().optional(),
}).superRefine((data, ctx) => {
  // If payment method is not COD, require sender number and transaction ID
  if (data.paymentMethod !== "COD") {
    if (!data.senderNumber || data.senderNumber === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter your mobile number used for payment",
        path: ["senderNumber"],
      });
    }
    if (!data.transactionId || data.transactionId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter the transaction ID",
        path: ["transactionId"],
      });
    }
  }
});

export type UserCheckoutFormData = z.infer<typeof userCheckoutSchema>;
