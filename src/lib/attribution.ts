/**
 * Traffic attribution: works out where a visitor came from, using the landing URL
 * and referrer. Pure functions only - safe to call from client or server.
 *
 * Priority: UTM params > platform click IDs > referrer domain > direct.
 */

/** A single recorded touch (one arrival at the site from an external source). */
export interface TouchData {
  channel: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  clickId: string | null;
  clickIdType: string | null;
  referrer: string | null;
  landingPage: string | null;
  timestamp: string;
}

/** Canonical channels. Anything unrecognised with an external referrer becomes "referral". */
export const CHANNELS = [
  "facebook",
  "instagram",
  "messenger",
  "tiktok",
  "google_ads",
  "google_organic",
  "youtube",
  "whatsapp",
  "bing",
  "pinterest",
  "snapchat",
  "twitter",
  "linkedin",
  "email",
  "referral",
  "direct",
] as const;

export type Channel = (typeof CHANNELS)[number];

/** Human labels for admin UI. */
export const CHANNEL_LABELS: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  messenger: "Messenger",
  tiktok: "TikTok",
  google_ads: "Google Ads",
  google_organic: "Google (Organic)",
  youtube: "YouTube",
  whatsapp: "WhatsApp",
  bing: "Bing",
  pinterest: "Pinterest",
  snapchat: "Snapchat",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  email: "Email",
  referral: "Referral",
  direct: "Direct",
};

/** Badge colours, matching the muted palette used elsewhere in admin. */
export const CHANNEL_COLORS: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  instagram: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  messenger: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  tiktok: "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-200",
  google_ads: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  google_organic: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  youtube: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  whatsapp: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  bing: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  pinterest: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
  snapchat: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  twitter: "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-200",
  linkedin: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  email: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  referral: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  direct: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

export function channelLabel(channel: string | null | undefined): string {
  if (!channel) return "Unknown";
  return CHANNEL_LABELS[channel] ?? channel;
}

export function channelColor(channel: string | null | undefined): string {
  if (!channel) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  return CHANNEL_COLORS[channel] ?? CHANNEL_COLORS.referral;
}

/**
 * Click IDs appended by ad platforms.
 * `paid` marks IDs that only ever appear on paid clicks. fbclid is set on ALL Meta
 * outbound clicks (organic posts included), so it does not imply paid traffic.
 */
const CLICK_IDS: Array<{ param: string; channel: Channel; paid: boolean }> = [
  { param: "gclid", channel: "google_ads", paid: true },
  { param: "gbraid", channel: "google_ads", paid: true },
  { param: "wbraid", channel: "google_ads", paid: true },
  { param: "ttclid", channel: "tiktok", paid: true },
  { param: "msclkid", channel: "bing", paid: true },
  { param: "epik", channel: "pinterest", paid: true },
  { param: "twclid", channel: "twitter", paid: true },
  { param: "sccid", channel: "snapchat", paid: true },
  { param: "li_fat_id", channel: "linkedin", paid: true },
  { param: "fbclid", channel: "facebook", paid: false },
];

/** Referrer host -> channel. Includes the mobile and link-shim variants seen in practice. */
const REFERRER_HOSTS: Array<{ match: (host: string) => boolean; channel: Channel }> = [
  { match: (h) => /(^|\.)(l|lm|m|web|business)?\.?facebook\.com$/.test(h) || h === "fb.com" || h.endsWith(".fb.me"), channel: "facebook" },
  { match: (h) => /(^|\.)instagram\.com$/.test(h), channel: "instagram" },
  { match: (h) => /(^|\.)messenger\.com$/.test(h), channel: "messenger" },
  { match: (h) => /(^|\.)tiktok\.com$/.test(h), channel: "tiktok" },
  { match: (h) => /(^|\.)(youtube\.com|youtu\.be)$/.test(h), channel: "youtube" },
  { match: (h) => /(^|\.)(whatsapp\.com)$/.test(h) || h === "wa.me", channel: "whatsapp" },
  { match: (h) => /(^|\.)bing\.com$/.test(h), channel: "bing" },
  { match: (h) => /(^|\.)pinterest\.[a-z.]+$/.test(h), channel: "pinterest" },
  { match: (h) => /(^|\.)snapchat\.com$/.test(h), channel: "snapchat" },
  { match: (h) => /(^|\.)(twitter\.com|x\.com|t\.co)$/.test(h), channel: "twitter" },
  { match: (h) => /(^|\.)linkedin\.com$/.test(h) || h === "lnkd.in", channel: "linkedin" },
  { match: (h) => /(^|\.)google\.[a-z.]+$/.test(h), channel: "google_organic" },
  { match: (h) => /(^|\.)(mail\.)?(yahoo|outlook|live|hotmail)\.[a-z.]+$/.test(h), channel: "email" },
];

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function clean(value: string | null, max = 200): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

/** Map a raw utm_source value onto a canonical channel where we recognise it. */
function channelFromUtmSource(source: string, medium: string | null): Channel {
  const s = source.toLowerCase();
  const m = (medium ?? "").toLowerCase();

  if (s.includes("instagram") || s === "ig") return "instagram";
  if (s.includes("messenger")) return "messenger";
  if (s.includes("facebook") || s === "fb" || s === "meta") return "facebook";
  if (s.includes("tiktok")) return "tiktok";
  if (s.includes("youtube")) return "youtube";
  if (s.includes("whatsapp")) return "whatsapp";
  if (s.includes("pinterest")) return "pinterest";
  if (s.includes("snapchat")) return "snapchat";
  if (s.includes("linkedin")) return "linkedin";
  if (s.includes("twitter") || s === "x") return "twitter";
  if (s.includes("bing")) return "bing";
  if (s.includes("google")) {
    // Paid mediums mean Ads; everything else from Google is treated as organic.
    return m === "cpc" || m === "ppc" || m === "paid" || m === "paid_search" ? "google_ads" : "google_organic";
  }
  if (s.includes("email") || s.includes("newsletter") || m === "email") return "email";

  return "referral";
}

/**
 * Resolve a single touch from a landing URL's query string and the referrer.
 *
 * @param search   window.location.search (may include or omit the leading "?")
 * @param referrer document.referrer ("" when absent)
 * @param landing  path (+ query) of the page where this touch happened
 * @param currentHost window.location.hostname - used for the self-referrer guard
 *
 * Returns null when the touch is internal navigation (referrer is our own host and
 * no campaign params present). Recording those would overwrite the real source.
 */
export function resolveTouch(
  search: string,
  referrer: string,
  landing: string,
  currentHost: string
): TouchData | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  const utmSource = clean(params.get("utm_source"));
  const utmMedium = clean(params.get("utm_medium"));
  const utmCampaign = clean(params.get("utm_campaign"));
  const utmContent = clean(params.get("utm_content"));
  const utmTerm = clean(params.get("utm_term"));

  const clickIdMatch = CLICK_IDS.find((c) => params.get(c.param));
  const hasCampaignParams = Boolean(utmSource || clickIdMatch);

  const referrerHost = referrer ? hostOf(referrer) : null;
  const isSelfReferrer =
    referrerHost != null && currentHost != null && referrerHost === currentHost.toLowerCase();

  // Self-referrer guard: internal clicks must never overwrite the real source.
  if (isSelfReferrer && !hasCampaignParams) {
    return null;
  }

  const base = {
    campaign: utmCampaign,
    content: utmContent,
    term: utmTerm,
    referrer: clean(referrer, 500),
    landingPage: clean(landing, 500),
    timestamp: new Date().toISOString(),
  };

  // 1. UTM parameters win outright.
  if (utmSource) {
    return {
      ...base,
      channel: channelFromUtmSource(utmSource, utmMedium),
      source: utmSource,
      medium: utmMedium,
      clickId: clickIdMatch ? clean(params.get(clickIdMatch.param)) : null,
      clickIdType: clickIdMatch?.param ?? null,
    };
  }

  // 2. Platform click IDs.
  if (clickIdMatch) {
    let channel: Channel = clickIdMatch.channel;
    // fbclid cannot distinguish Facebook from Instagram - use the referrer when we have one.
    if (clickIdMatch.param === "fbclid" && referrerHost) {
      const viaReferrer = REFERRER_HOSTS.find((r) => r.match(referrerHost));
      if (viaReferrer && ["facebook", "instagram", "messenger"].includes(viaReferrer.channel)) {
        channel = viaReferrer.channel;
      }
    }
    return {
      ...base,
      channel,
      source: channel,
      medium: clickIdMatch.paid ? "paid" : null,
      clickId: clean(params.get(clickIdMatch.param)),
      clickIdType: clickIdMatch.param,
    };
  }

  // 3. Referrer domain.
  if (referrerHost && !isSelfReferrer) {
    const viaReferrer = REFERRER_HOSTS.find((r) => r.match(referrerHost));
    const channel: Channel = viaReferrer?.channel ?? "referral";
    return {
      ...base,
      channel,
      source: referrerHost,
      medium: channel === "google_organic" ? "organic" : "referral",
      clickId: null,
      clickIdType: null,
    };
  }

  // 4. Direct.
  return {
    ...base,
    channel: "direct",
    source: null,
    medium: "direct",
    clickId: null,
    clickIdType: null,
  };
}

/**
 * True when the fbclid-derived channel could not be narrowed to a specific Meta app.
 * The admin UI uses this to avoid asserting "Facebook" when we only know "Meta".
 */
export function isAmbiguousMeta(touch: TouchData | null | undefined): boolean {
  return Boolean(touch && touch.clickIdType === "fbclid" && !touch.referrer);
}
