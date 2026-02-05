import { z } from "zod";
import { CITIES } from "@/lib/constants";

const cityValues = CITIES.map((c) => c.value) as [string, ...string[]];

export const checkoutSchema = z.object({
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
  
  city: z.enum(cityValues as [string, ...string[]], {
    error: "Please select a city",
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
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Schema for guest checkout (same as above but explicit)
export const guestCheckoutSchema = checkoutSchema;

// Schema for logged-in user checkout (can use saved address)
export const userCheckoutSchema = checkoutSchema.extend({
  usesSavedAddress: z.boolean().optional(),
  savedAddressId: z.string().optional(),
});

export type UserCheckoutFormData = z.infer<typeof userCheckoutSchema>;
