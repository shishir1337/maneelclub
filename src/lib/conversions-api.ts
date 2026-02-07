/**
 * Meta Conversions API – server-side event sending.
 * See: https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * Credentials: env META_PIXEL_ID + META_CAPI_ACCESS_TOKEN, or pass via options (e.g. from admin settings).
 * Optional: NEXT_PUBLIC_APP_URL for event_source_url
 */

import { createHash } from "crypto";
const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

/** SHA256 hash for Meta (normalize then hash). */
function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Normalize email: trim, lowercase. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Normalize phone: digits only; prepend country code 880 for BD if 11 digits. */
export function normalizePhone(phone: string, countryCode = "880"): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    return countryCode + digits.slice(1);
  }
  if (digits.length === 10 && digits.startsWith("1")) {
    return countryCode + digits;
  }
  return digits.length >= 10 ? (digits.startsWith(countryCode) ? digits : countryCode + digits) : digits;
}

/** Hash email for user_data.em (array of one hashed value). */
function hashEmail(email: string): string[] {
  const normalized = normalizeEmail(email);
  return normalized ? [sha256(normalized)] : [];
}

/** Hash phone for user_data.ph (array of one or two hashed values). */
function hashPhone(phone: string): string[] {
  const normalized = normalizePhone(phone);
  return normalized ? [sha256(normalized)] : [];
}

export interface ConversionsApiUserData {
  em?: string[];
  ph?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
}

export interface ConversionsApiCustomData {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_type?: "product" | "product_group";
  num_items?: number;
  order_id?: string;
}

export interface SendServerEventInput {
  event_name: string;
  event_time?: number;
  event_id?: string;
  event_source_url?: string;
  action_source?: "website" | "app" | "email" | "phone_call" | "chat" | "physical_store" | "system_generated" | "business_messaging" | "other";
  user_data: ConversionsApiUserData;
  custom_data?: ConversionsApiCustomData;
}

/** Build user_data with hashed PII. Pass raw email/phone; they are hashed here. */
export function buildUserData(options: {
  email?: string | null;
  phone?: string | null;
  client_ip_address?: string | null;
  client_user_agent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}): ConversionsApiUserData {
  const userData: ConversionsApiUserData = {};
  if (options.email) userData.em = hashEmail(options.email);
  if (options.phone) userData.ph = hashPhone(options.phone);
  if (options.client_ip_address) userData.client_ip_address = options.client_ip_address;
  if (options.client_user_agent) userData.client_user_agent = options.client_user_agent;
  if (options.fbp) userData.fbp = options.fbp;
  if (options.fbc) userData.fbc = options.fbc;
  return userData;
}

/** Send a single server event to the Conversions API. No-op if credentials not set. */
export async function sendServerEvent(
  input: SendServerEventInput,
  credentials?: { pixelId?: string; accessToken?: string }
): Promise<{ ok: boolean; error?: string }> {
  const pixelId = credentials?.pixelId || process.env.META_PIXEL_ID;
  const accessToken = credentials?.accessToken || process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !accessToken) {
    return { ok: true };
  }

  const event_time = input.event_time ?? Math.floor(Date.now() / 1000);
  const event_source_url = input.event_source_url ?? process.env.NEXT_PUBLIC_APP_URL ?? undefined;
  const action_source = input.action_source ?? "website";

  const body = {
    data: [
      {
        event_name: input.event_name,
        event_time,
        ...(input.event_id && { event_id: input.event_id }),
        ...(event_source_url && { event_source_url }),
        action_source,
        user_data: input.user_data,
        ...(input.custom_data && Object.keys(input.custom_data).length > 0 && { custom_data: input.custom_data }),
      },
    ],
  };

  try {
    const url = `${BASE_URL}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      console.error("[Conversions API]", data?.error?.message ?? res.statusText);
      return { ok: false, error: data?.error?.message ?? res.statusText };
    }
    return { ok: true };
  } catch (err) {
    console.error("[Conversions API]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/** Send a Purchase event (e.g. after order creation). Use order_id as event_id for deduplication with Pixel. */
export async function sendPurchaseEvent(options: {
  order_id: string;
  value: number;
  currency?: string;
  num_items?: number;
  content_ids?: string[];
  email?: string | null;
  phone?: string | null;
  client_ip_address?: string | null;
  client_user_agent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  event_source_url?: string | null;
  /** Override from admin settings when env not set */
  _credentials?: { pixelId: string; accessToken: string };
}): Promise<{ ok: boolean; error?: string }> {
  const { _credentials, ...opts } = options;
  const user_data = buildUserData({
    email: opts.email,
    phone: opts.phone,
    client_ip_address: opts.client_ip_address,
    client_user_agent: opts.client_user_agent,
    fbp: opts.fbp,
    fbc: opts.fbc,
  });

  return sendServerEvent(
    {
      event_name: "Purchase",
      event_id: opts.order_id,
      event_source_url: opts.event_source_url ?? undefined,
      action_source: "website",
      user_data,
      custom_data: {
        order_id: opts.order_id,
        value: opts.value,
        currency: (opts.currency ?? "BDT").toUpperCase(),
        num_items: opts.num_items,
        content_ids: opts.content_ids,
        content_type: "product",
      },
    },
    _credentials ? { pixelId: _credentials.pixelId, accessToken: _credentials.accessToken } : undefined
  );
}
