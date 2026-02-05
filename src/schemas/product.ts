import { z } from "zod";

// Schema for creating/updating products (admin)
export const productSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title is too long"),
  
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(200, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  
  description: z
    .string()
    .max(5000, "Description is too long")
    .optional()
    .nullable(),
  
  price: z
    .number()
    .positive("Price must be positive")
    .max(1000000, "Price is too high"),
  
  discountPrice: z
    .number()
    .positive("Discount price must be positive")
    .optional()
    .nullable(),
  
  categoryId: z.string().optional().nullable(),
  
  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed"),
  
  featured: z.boolean().default(false),
  
  isActive: z.boolean().default(true),
  
  sizeChart: z
    .object({
      headers: z.array(z.string()),
      rows: z.array(
        z.object({
          size: z.string(),
          measurements: z.array(z.string()),
        })
      ),
    })
    .optional()
    .nullable(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Schema for product variants
export const productVariantSchema = z.object({
  color: z.string().min(1, "Color is required"),
  size: z.string().min(1, "Size is required"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  sku: z.string().optional().nullable(),
});

export type ProductVariantFormData = z.infer<typeof productVariantSchema>;

// Schema for product with variants (full form)
export const productWithVariantsSchema = productSchema.extend({
  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant is required"),
});

export type ProductWithVariantsFormData = z.infer<typeof productWithVariantsSchema>;

// Schema for category
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(100, "Slug is too long")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  
  description: z
    .string()
    .max(500, "Description is too long")
    .optional()
    .nullable(),
  
  image: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable(),
  
  isActive: z.boolean().default(true),
  
  sortOrder: z.number().int().min(0).default(0),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
