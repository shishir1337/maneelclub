import { db } from "@/lib/db";
import { cache } from "react";
import { DEFAULT_SETTINGS } from "@/lib/settings-defaults";

// Cache the settings fetch to avoid multiple database calls per request
export const getSettings = cache(async (): Promise<Record<string, string>> => {
  try {
    const settings = await db.setting.findMany();
    
    // Merge with defaults
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };
    
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    
    return result;
  } catch (error) {
    console.error("Error fetching settings:", error);
    return DEFAULT_SETTINGS as unknown as Record<string, string>;
  }
});

// Get a single setting value with default fallback
export async function getSetting(key: string): Promise<string> {
  const settings = await getSettings();
  return settings[key] ?? DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS] ?? "";
}

// Shipping rates helper
export async function getShippingRates(): Promise<{ dhaka: number; outside: number }> {
  const settings = await getSettings();
  return {
    dhaka: parseInt(settings.shippingDhaka || "80", 10),
    outside: parseInt(settings.shippingOutside || "130", 10),
  };
}

// Dynamic shipping cost based on city (using database settings)
export async function getDynamicShippingCost(city: string): Promise<number> {
  const rates = await getShippingRates();
  
  // Dhaka areas get dhaka rate
  const dhakaAreas = ["dhaka", "gazipur", "narayanganj"];
  if (dhakaAreas.includes(city.toLowerCase())) {
    return rates.dhaka;
  }
  
  return rates.outside;
}

// Get merchant payment numbers
export async function getMerchantNumbers(): Promise<{
  bkash: string;
  nagad: string;
  rocket: string;
}> {
  const settings = await getSettings();
  return {
    bkash: settings.bkashNumber || "01854938837",
    nagad: settings.nagadNumber || "01854938837",
    rocket: settings.rocketNumber || "01854938837",
  };
}

// Get announcement settings
export async function getAnnouncementSettings(): Promise<{
  enabled: boolean;
  message: string;
  link: string;
  linkText: string;
}> {
  const settings = await getSettings();
  return {
    enabled: settings.announcementEnabled === "true",
    message: settings.announcementMessage || "",
    link: settings.announcementLink || "",
    linkText: settings.announcementLinkText || "",
  };
}

// Get low stock threshold
export async function getLowStockThreshold(): Promise<number> {
  const settings = await getSettings();
  return parseInt(settings.lowStockThreshold || "5", 10);
}

// Get free shipping minimum
export async function getFreeShippingMinimum(): Promise<number> {
  const settings = await getSettings();
  return parseInt(settings.freeShippingMinimum || "2000", 10);
}

// Get Meta Pixel settings (public: pixel ID + enabled - safe to expose to client)
export async function getMetaPixelSettings(): Promise<{ enabled: boolean; pixelId: string }> {
  const settings = await getSettings();
  return {
    enabled: settings.metaPixelEnabled === "true",
    pixelId: settings.metaPixelId || "",
  };
}

// Get GTM container ID for script injection (public - safe to expose)
export async function getGtmSettings(): Promise<{ containerId: string }> {
  const settings = await getSettings();
  const id = (settings.gtmContainerId || "").trim();
  return {
    containerId: id.startsWith("GTM-") ? id : id ? `GTM-${id}` : "",
  };
}

// Get Meta Conversions API settings (server-only - never expose token to client)
export async function getMetaCapiSettings(): Promise<{ pixelId: string; accessToken: string }> {
  const settings = await getSettings();
  return {
    pixelId: settings.metaPixelId || "",
    accessToken: settings.metaCapiAccessToken || "",
  };
}
