"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Get current user session
async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in");
  }

  return session.user;
}

// Address schema
const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^01[3-9][0-9]{8}$/, "Please enter a valid 11-digit BD mobile number"),
  address: z.string().min(10, "Please enter a complete address"),
  city: z.string().min(2, "City is required"),
  altPhone: z.string().regex(/^01[3-9][0-9]{8}$/, "Please enter a valid 11-digit BD mobile number").optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

// Get all addresses for current user
export async function getUserAddresses() {
  try {
    const currentUser = await getCurrentUser();

    const addresses = await db.address.findMany({
      where: { userId: currentUser.id },
      orderBy: { isDefault: "desc" },
    });

    return { success: true, data: addresses };
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch addresses",
    };
  }
}

// Get a single address by ID
export async function getAddressById(id: string) {
  try {
    const currentUser = await getCurrentUser();

    const address = await db.address.findFirst({
      where: {
        id,
        userId: currentUser.id,
      },
    });

    if (!address) {
      return { success: false, error: "Address not found" };
    }

    return { success: true, data: address };
  } catch (error) {
    console.error("Error fetching address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch address",
    };
  }
}

// Create a new address
export async function createAddress(data: AddressInput) {
  try {
    const currentUser = await getCurrentUser();

    // Validate input
    const validated = addressSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid data",
      };
    }

    // If this is the first address or marked as default, handle default status
    const existingAddresses = await db.address.count({
      where: { userId: currentUser.id },
    });

    const shouldBeDefault = existingAddresses === 0 || validated.data.isDefault;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      await db.address.updateMany({
        where: { userId: currentUser.id },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: {
        userId: currentUser.id,
        name: validated.data.name,
        phone: validated.data.phone,
        address: validated.data.address,
        city: validated.data.city,
        altPhone: validated.data.altPhone || null,
        isDefault: shouldBeDefault,
      },
    });

    revalidatePath("/dashboard/addresses");
    revalidatePath("/checkout");

    return { success: true, data: address };
  } catch (error) {
    console.error("Error creating address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create address",
    };
  }
}

// Update an existing address
export async function updateAddress(id: string, data: AddressInput) {
  try {
    const currentUser = await getCurrentUser();

    // Verify ownership
    const existing = await db.address.findFirst({
      where: {
        id,
        userId: currentUser.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Address not found" };
    }

    // Validate input
    const validated = addressSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid data",
      };
    }

    // If setting as default, unset other defaults
    if (validated.data.isDefault && !existing.isDefault) {
      await db.address.updateMany({
        where: { userId: currentUser.id },
        data: { isDefault: false },
      });
    }

    const address = await db.address.update({
      where: { id },
      data: {
        name: validated.data.name,
        phone: validated.data.phone,
        address: validated.data.address,
        city: validated.data.city,
        altPhone: validated.data.altPhone || null,
        isDefault: validated.data.isDefault ?? existing.isDefault,
      },
    });

    revalidatePath("/dashboard/addresses");
    revalidatePath("/checkout");

    return { success: true, data: address };
  } catch (error) {
    console.error("Error updating address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update address",
    };
  }
}

// Delete an address
export async function deleteAddress(id: string) {
  try {
    const currentUser = await getCurrentUser();

    // Verify ownership
    const existing = await db.address.findFirst({
      where: {
        id,
        userId: currentUser.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Address not found" };
    }

    await db.address.delete({
      where: { id },
    });

    // If deleted address was default, make the most recent one default
    if (existing.isDefault) {
      const nextDefault = await db.address.findFirst({
        where: { userId: currentUser.id },
        orderBy: { isDefault: "desc" },
      });

      if (nextDefault) {
        await db.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    revalidatePath("/dashboard/addresses");
    revalidatePath("/checkout");

    return { success: true };
  } catch (error) {
    console.error("Error deleting address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete address",
    };
  }
}

// Set an address as default
export async function setDefaultAddress(id: string) {
  try {
    const currentUser = await getCurrentUser();

    // Verify ownership
    const existing = await db.address.findFirst({
      where: {
        id,
        userId: currentUser.id,
      },
    });

    if (!existing) {
      return { success: false, error: "Address not found" };
    }

    // Unset all other defaults
    await db.address.updateMany({
      where: { userId: currentUser.id },
      data: { isDefault: false },
    });

    // Set this one as default
    const address = await db.address.update({
      where: { id },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard/addresses");
    revalidatePath("/checkout");

    return { success: true, data: address };
  } catch (error) {
    console.error("Error setting default address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set default address",
    };
  }
}

// Get user's default address
export async function getDefaultAddress() {
  try {
    const currentUser = await getCurrentUser();

    const address = await db.address.findFirst({
      where: {
        userId: currentUser.id,
        isDefault: true,
      },
    });

    return { success: true, data: address };
  } catch (error) {
    console.error("Error fetching default address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch default address",
    };
  }
}
