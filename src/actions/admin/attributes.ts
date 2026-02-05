"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Schema for attribute creation/update
const attributeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  sortOrder: z.number().int().default(0),
});

// Schema for attribute value creation/update
const attributeValueSchema = z.object({
  value: z.string().min(1, "Value is required"),
  displayValue: z.string().min(1, "Display value is required"),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
  sortOrder: z.number().int().default(0),
});

type AttributeInput = z.infer<typeof attributeSchema>;
type AttributeValueInput = z.infer<typeof attributeValueSchema>;

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

// ==================== ATTRIBUTE CRUD ====================

// Get all attributes with their values
export async function getAttributes() {
  try {
    await checkAdmin();

    const attributes = await db.attribute.findMany({
      include: {
        values: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return { success: true, data: attributes };
  } catch (error) {
    console.error("Error fetching attributes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch attributes",
    };
  }
}

// Get single attribute by ID
export async function getAttributeById(id: string) {
  try {
    await checkAdmin();

    const attribute = await db.attribute.findUnique({
      where: { id },
      include: {
        values: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!attribute) {
      return { success: false, error: "Attribute not found" };
    }

    return { success: true, data: attribute };
  } catch (error) {
    console.error("Error fetching attribute:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch attribute",
    };
  }
}

// Create attribute
export async function createAttribute(input: AttributeInput) {
  try {
    await checkAdmin();

    const validated = attributeSchema.parse(input);

    // Check if slug already exists
    const existing = await db.attribute.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return { success: false, error: "An attribute with this slug already exists" };
    }

    const attribute = await db.attribute.create({
      data: validated,
      include: {
        values: true,
      },
    });

    revalidatePath("/admin/attributes");
    revalidatePath("/admin/products");

    return { success: true, data: attribute };
  } catch (error) {
    console.error("Error creating attribute:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create attribute",
    };
  }
}

// Update attribute
export async function updateAttribute(id: string, input: Partial<AttributeInput>) {
  try {
    await checkAdmin();

    const attribute = await db.attribute.findUnique({ where: { id } });

    if (!attribute) {
      return { success: false, error: "Attribute not found" };
    }

    // If slug is being changed, check for conflicts
    if (input.slug && input.slug !== attribute.slug) {
      const existing = await db.attribute.findUnique({
        where: { slug: input.slug },
      });

      if (existing) {
        return { success: false, error: "An attribute with this slug already exists" };
      }
    }

    const updated = await db.attribute.update({
      where: { id },
      data: input,
      include: {
        values: true,
      },
    });

    revalidatePath("/admin/attributes");
    revalidatePath("/admin/products");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating attribute:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update attribute",
    };
  }
}

// Delete attribute
export async function deleteAttribute(id: string) {
  try {
    await checkAdmin();

    const attribute = await db.attribute.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!attribute) {
      return { success: false, error: "Attribute not found" };
    }

    if (attribute._count.products > 0) {
      return {
        success: false,
        error: "Cannot delete attribute with products. Remove products first.",
      };
    }

    // Delete all values first, then the attribute
    await db.attributeValue.deleteMany({ where: { attributeId: id } });
    await db.attribute.delete({ where: { id } });

    revalidatePath("/admin/attributes");
    revalidatePath("/admin/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting attribute:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete attribute",
    };
  }
}

// ==================== ATTRIBUTE VALUE CRUD ====================

// Create attribute value
export async function createAttributeValue(attributeId: string, input: AttributeValueInput) {
  try {
    await checkAdmin();

    const validated = attributeValueSchema.parse(input);

    // Check if attribute exists
    const attribute = await db.attribute.findUnique({ where: { id: attributeId } });
    if (!attribute) {
      return { success: false, error: "Attribute not found" };
    }

    // Check if value already exists for this attribute
    const existing = await db.attributeValue.findUnique({
      where: {
        attributeId_value: {
          attributeId,
          value: validated.value,
        },
      },
    });

    if (existing) {
      return { success: false, error: "This value already exists for this attribute" };
    }

    const value = await db.attributeValue.create({
      data: {
        attributeId,
        value: validated.value,
        displayValue: validated.displayValue,
        sortOrder: validated.sortOrder,
        metadata: validated.metadata ?? undefined,
      },
    });

    revalidatePath("/admin/attributes");
    revalidatePath("/admin/products");

    return { success: true, data: value };
  } catch (error) {
    console.error("Error creating attribute value:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create value",
    };
  }
}

// Update attribute value
export async function updateAttributeValue(id: string, input: Partial<AttributeValueInput>) {
  try {
    await checkAdmin();

    const value = await db.attributeValue.findUnique({ where: { id } });

    if (!value) {
      return { success: false, error: "Value not found" };
    }

    // If value is being changed, check for conflicts
    if (input.value && input.value !== value.value) {
      const existing = await db.attributeValue.findUnique({
        where: {
          attributeId_value: {
            attributeId: value.attributeId,
            value: input.value,
          },
        },
      });

      if (existing) {
        return { success: false, error: "This value already exists for this attribute" };
      }
    }

    const updateData: { value?: string; displayValue?: string; sortOrder?: number; metadata?: object } = {};
    if (input.value !== undefined) updateData.value = input.value;
    if (input.displayValue !== undefined) updateData.displayValue = input.displayValue;
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;
    if (input.metadata !== undefined) updateData.metadata = input.metadata ?? undefined;

    const updated = await db.attributeValue.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/attributes");
    revalidatePath("/admin/products");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating attribute value:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update value",
    };
  }
}

// Delete attribute value
export async function deleteAttributeValue(id: string) {
  try {
    await checkAdmin();

    const value = await db.attributeValue.findUnique({
      where: { id },
      include: {
        _count: { select: { variants: true, productValues: true } },
      },
    });

    if (!value) {
      return { success: false, error: "Value not found" };
    }

    if (value._count.variants > 0 || value._count.productValues > 0) {
      return {
        success: false,
        error: "Cannot delete value that is in use by products.",
      };
    }

    await db.attributeValue.delete({ where: { id } });

    revalidatePath("/admin/attributes");
    revalidatePath("/admin/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting attribute value:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete value",
    };
  }
}

// Reorder attribute values
export async function reorderAttributeValues(
  attributeId: string,
  orderedIds: string[]
) {
  try {
    await checkAdmin();

    // Update sort order for each value
    await Promise.all(
      orderedIds.map((id, index) =>
        db.attributeValue.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    revalidatePath("/admin/attributes");

    return { success: true };
  } catch (error) {
    console.error("Error reordering values:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reorder values",
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

// Get all attributes for product forms (public - no admin check)
export async function getAttributesForProductForm() {
  try {
    const attributes = await db.attribute.findMany({
      include: {
        values: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return { success: true, data: attributes };
  } catch (error) {
    console.error("Error fetching attributes:", error);
    return {
      success: false,
      error: "Failed to fetch attributes",
      data: [],
    };
  }
}
