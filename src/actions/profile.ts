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

// Get user profile data
export async function getProfile() {
  try {
    const currentUser = await getCurrentUser();

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: user };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile",
    };
  }
}

// Update profile schema
const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^01[3-9][0-9]{8}$/, "Please enter a valid 11-digit BD mobile number").optional().or(z.literal("")),
});

// Update user profile
export async function updateProfile(data: { name: string; phone?: string }) {
  try {
    const currentUser = await getCurrentUser();

    // Validate input
    const validated = updateProfileSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid data",
      };
    }

    const updated = await db.user.update({
      where: { id: currentUser.id },
      data: {
        name: validated.data.name,
        phone: validated.data.phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    revalidatePath("/dashboard/profile");

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

// Change password schema
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Change password
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  try {
    const currentUser = await getCurrentUser();

    // Validate input
    const validated = changePasswordSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || "Invalid data",
      };
    }

    // Get user's account with password
    const account = await db.account.findFirst({
      where: {
        userId: currentUser.id,
        providerId: "credential",
      },
    });

    if (!account || !account.password) {
      return {
        success: false,
        error: "No password set for this account. You may have signed up with a social provider.",
      };
    }

    // Verify current password using Better Auth's context
    // Note: Better Auth handles password hashing internally
    // We need to use bcrypt to verify
    const bcrypt = await import("bcryptjs");
    const isValidPassword = await bcrypt.compare(
      validated.data.currentPassword,
      account.password
    );

    if (!isValidPassword) {
      return {
        success: false,
        error: "Current password is incorrect",
      };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validated.data.newPassword, 10);

    // Update password
    await db.account.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Error changing password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to change password",
    };
  }
}

// Delete account
export async function deleteAccount() {
  try {
    const currentUser = await getCurrentUser();

    // Delete user and all related data (cascading delete is set up in schema)
    await db.user.delete({
      where: { id: currentUser.id },
    });

    return { success: true, message: "Account deleted successfully" };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}
