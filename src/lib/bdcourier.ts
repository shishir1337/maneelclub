/**
 * BDCourier API client for courier fraud check by phone.
 * API key must be set via BDCOURIER_API_KEY (server-side only).
 */

const API_BASE = "https://api.bdcourier.com";
const FETCH_TIMEOUT_MS = 10000; // 10 seconds
const MAX_RETRIES = 2;

/** Normalize phone number to API format (017xxxxxxxx) */
function normalizePhone(phone: string): string {
  // Remove all non-digits (handles +880, spaces, dashes, etc.)
  let cleaned = phone.replace(/[^\d]/g, "");
  
  // Convert 880 prefix to 0 (e.g., 8801730285500 -> 01730285500)
  if (cleaned.startsWith("880") && cleaned.length >= 13) {
    cleaned = "0" + cleaned.substring(3);
  }
  
  // If it's 10 digits without leading 0, add 0 (e.g., 1730285500 -> 01730285500)
  if (!cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  
  return cleaned;
}

/** Sanitize error messages for client (don't expose API internals) */
function sanitizeError(error: string): string {
  // Keep user-friendly messages
  if (error.includes("not configured") || error.includes("required")) {
    return error;
  }
  
  // Generic messages for API/network errors
  if (error.includes("timeout") || error.includes("aborted")) {
    return "Request timed out. Please try again.";
  }
  
  if (error.includes("fetch") || error.includes("network") || error.includes("ECONNREFUSED")) {
    return "Courier check service unavailable. Please try again later.";
  }
  
  if (error.includes("API error") || error.includes("status")) {
    return "Courier check service error. Please try again later.";
  }
  
  // Keep original if it's already user-friendly (e.g., "Phone number not found")
  return error;
}

/** Single courier stats from API (pathao, steadfast, redx, etc.) */
export interface CourierCheckCourierItem {
  name: string;
  logo?: string;
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}

/** Summary across all couriers */
export interface CourierCheckSummary {
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}

/** Success response: data is keyed by slug (pathao, steadfast, summary, etc.) */
export interface CourierCheckSuccess {
  status: "success";
  data: {
    summary?: CourierCheckSummary;
    [slug: string]: CourierCheckCourierItem | CourierCheckSummary | undefined;
  };
  reports?: unknown[];
}

export interface CourierCheckError {
  status: "error";
  error: string;
}

export type CourierCheckResponse = CourierCheckSuccess | CourierCheckError;

export type CourierCheckData = CourierCheckResponse;

export interface CourierCheckResult {
  success: true;
  data: CourierCheckResponse;
}

export interface CourierCheckFailure {
  success: false;
  error: string;
}

/** Get courier items from success data (excludes "summary" key) */
export function getCourierItemsFromData(
  data: CourierCheckSuccess["data"]
): CourierCheckCourierItem[] {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data)
    .filter(([key]) => key !== "summary")
    .map(([, v]) => v)
    .filter((v): v is CourierCheckCourierItem => v != null && "name" in v && typeof (v as CourierCheckCourierItem).name === "string");
}

/** Get summary from success data */
export function getSummaryFromData(
  data: CourierCheckSuccess["data"]
): CourierCheckSummary | null {
  if (!data || typeof data !== "object") return null;
  const s = data.summary;
  if (!s || typeof s !== "object" || typeof (s as CourierCheckSummary).success_ratio !== "number") return null;
  return s as CourierCheckSummary;
}

/**
 * Call BDCourier courier-check API for a phone number with retry logic.
 * Returns typed success/error. Does not throw.
 */
export async function courierCheckByPhone(
  phone: string
): Promise<CourierCheckResult | CourierCheckFailure> {
  const apiKey = process.env.BDCOURIER_API_KEY;
  if (!apiKey?.trim()) {
    return { success: false, error: "Courier check not configured" };
  }

  const trimmed = phone?.trim();
  if (!trimmed) {
    return { success: false, error: "Phone number is required" };
  }

  // Normalize phone number to API format
  const normalizedPhone = normalizePhone(trimmed);
  if (!normalizedPhone.match(/^0\d{10}$/)) {
    return { success: false, error: "Invalid phone number format" };
  }

  // Retry logic with exponential backoff
  let lastError: string | null = null;
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(`${API_BASE}/courier-check`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: normalizedPhone }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = (await res.json()) as CourierCheckResponse & { message?: string };

      if (!res.ok) {
        const errMsg =
          (json as CourierCheckError).error ??
          json.message ??
          `API error: ${res.status} ${res.statusText}`;
        
        // Don't retry on 4xx errors (client errors)
        if (res.status >= 400 && res.status < 500) {
          return { success: false, error: sanitizeError(errMsg) };
        }
        
        // Retry on 5xx errors (server errors)
        lastError = errMsg;
        if (attempt < MAX_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        return { success: false, error: sanitizeError(errMsg) };
      }

      if ((json as CourierCheckError).status === "error") {
        return {
          success: true,
          data: json,
        };
      }

      return { success: true, data: json };
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      const isNetworkError = err instanceof Error && (
        err.message.includes("fetch") ||
        err.message.includes("network") ||
        err.message.includes("ECONNREFUSED")
      );

      // Don't retry on abort (timeout) or network errors on last attempt
      if (isAbort || (isNetworkError && attempt === MAX_RETRIES)) {
        const message = isAbort
          ? "Request timed out"
          : err instanceof Error
          ? err.message
          : "Courier check request failed";
        return { success: false, error: sanitizeError(message) };
      }

      // Retry on network errors
      if (isNetworkError && attempt < MAX_RETRIES) {
        lastError = err instanceof Error ? err.message : "Courier check request failed";
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      const message =
        err instanceof Error ? err.message : "Courier check request failed";
      return { success: false, error: sanitizeError(message) };
    }
  }

  // Fallback (shouldn't reach here, but TypeScript needs it)
  return {
    success: false,
    error: sanitizeError(lastError || "Courier check request failed"),
  };
}
