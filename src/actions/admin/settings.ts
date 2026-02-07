"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { DEFAULT_SETTINGS, type SettingsKey } from "@/lib/settings-defaults";

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

// Get all settings
export async function getSettings() {
  try {
    const settings = await db.setting.findMany();
    
    // Merge with defaults
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error("Error fetching settings:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch settings",
      data: DEFAULT_SETTINGS as Record<string, string>,
    };
  }
}

// Get a single setting by key
export async function getSetting(key: string) {
  try {
    const setting = await db.setting.findUnique({
      where: { key },
    });
    
    // Return default if not found
    const defaultValue = DEFAULT_SETTINGS[key as SettingsKey] ?? "";
    
    return { 
      success: true, 
      data: setting?.value ?? defaultValue,
    };
  } catch (error) {
    console.error("Error fetching setting:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch setting",
      data: DEFAULT_SETTINGS[key as SettingsKey] ?? "",
    };
  }
}

// Update settings (bulk update)
export async function updateSettings(data: Record<string, string>) {
  try {
    await checkAdmin();

    // Upsert each setting
    const operations = Object.entries(data).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );

    await db.$transaction(operations);

    revalidatePath("/admin/settings");
    revalidatePath("/"); // Revalidate homepage and layout (announcement, Meta Pixel)

    return { success: true };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update settings" 
    };
  }
}

// Update a single setting
export async function updateSetting(key: string, value: string) {
  try {
    await checkAdmin();

    await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating setting:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update setting" 
    };
  }
}

// Delete a setting (revert to default)
export async function deleteSetting(key: string) {
  try {
    await checkAdmin();

    await db.setting.delete({
      where: { key },
    }).catch(() => {
      // Setting might not exist, that's fine
    });

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error deleting setting:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to delete setting" 
    };
  }
}

// Get shipping rates from settings
export async function getShippingRates() {
  try {
    const [dhakaResult, outsideResult] = await Promise.all([
      getSetting("shippingDhaka"),
      getSetting("shippingOutside"),
    ]);
    
    return {
      dhaka: parseInt(dhakaResult.data || "70", 10),
      outside: parseInt(outsideResult.data || "130", 10),
    };
  } catch (error) {
    console.error("Error fetching shipping rates:", error);
    return {
      dhaka: 70,
      outside: 130,
    };
  }
}

// Get merchant payment numbers from settings
export async function getMerchantNumbers() {
  try {
    const [bkashResult, nagadResult, rocketResult] = await Promise.all([
      getSetting("bkashNumber"),
      getSetting("nagadNumber"),
      getSetting("rocketNumber"),
    ]);
    
    return {
      bkash: bkashResult.data || "01854938837",
      nagad: nagadResult.data || "01854938837",
      rocket: rocketResult.data || "01854938837",
    };
  } catch (error) {
    console.error("Error fetching merchant numbers:", error);
    return {
      bkash: "01854938837",
      nagad: "01854938837",
      rocket: "01854938837",
    };
  }
}
