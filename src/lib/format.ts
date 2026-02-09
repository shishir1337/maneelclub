import { siteConfig } from "./constants";

/**
 * Format price with currency symbol
 * @param price - The price to format (number or string)
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined) return `${siteConfig.currencySymbol}0`;
  
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) return `${siteConfig.currencySymbol}0`;
  
  // Format with commas for thousands
  const formatted = numPrice.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return `${siteConfig.currencySymbol}${formatted}`;
}

/**
 * Calculate discount percentage
 * @param originalPrice - Original price
 * @param discountPrice - Discounted price
 * @returns Discount percentage (rounded)
 */
export function calculateDiscount(
  originalPrice: number | string,
  discountPrice: number | string
): number {
  const original = typeof originalPrice === "string" ? parseFloat(originalPrice) : originalPrice;
  const discount = typeof discountPrice === "string" ? parseFloat(discountPrice) : discountPrice;
  
  if (original <= 0 || discount >= original) return 0;
  
  return Math.round(((original - discount) / original) * 100);
}

/**
 * Format date to readable string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date with relative time (e.g., "1 hour ago") if less than 24 hours
 * @param date - Date to format
 * @returns Formatted date string with relative time if applicable
 */
export function formatDateWithRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // If less than 24 hours, show relative time
  if (diffHours < 24 && diffHours >= 0) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHoursRounded = Math.floor(diffHours);
    const remainingMinutes = diffMinutes % 60;
    
    let relativeTime = "";
    if (diffHoursRounded > 0) {
      relativeTime = `${diffHoursRounded} hour${diffHoursRounded > 1 ? "s" : ""}`;
      if (remainingMinutes > 0) {
        relativeTime += ` ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}`;
      }
    } else {
      relativeTime = `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""}`;
    }
    
    const formattedDate = formatDate(d);
    return `${formattedDate} (${relativeTime} ago)`;
  }
  
  // Otherwise, just show the date
  return formatDate(d);
}

/**
 * Format date with time
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generate order number
 * @returns Unique order number
 */
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MC-${timestamp}-${random}`;
}

/**
 * Slugify a string
 * @param text - Text to slugify
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}
