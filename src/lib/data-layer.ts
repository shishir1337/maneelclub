/**
 * Data layer for GTM and Meta (Facebook) Pixel.
 *
 * Pushes e-commerce events to window.dataLayer. GTM can use these events to fire
 * tags (Meta Pixel, GA4, etc.). When Meta Pixel script is loaded (Admin → Settings),
 * we also call fbq("track", ...) so Pixel receives events directly.
 *
 * Events sent (all include standard parameters for Meta/GA4):
 * - PageView      : every route change (page_path, page_title)
 * - ViewContent   : product detail view (content_ids, content_type, content_name, value, currency)
 * - AddToCart     : add to cart click (content_ids, content_name, value, currency, num_items)
 * - InitiateCheckout : checkout page with items (value, currency, num_items, content_ids)
 * - Purchase      : order confirmation (order_id, value, currency, num_items, content_ids, event_id)
 * - Search        : optional (search_string)
 */

const DEFAULT_CURRENCY = "BDT";

declare global {
  interface Window {
    dataLayer: unknown[];
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>, opts?: { eventID?: string }) => void;
  }
}

/** Ensure dataLayer exists (for GTM / Meta Pixel) */
function ensureDataLayer(): void {
  if (typeof window === "undefined") return;
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
}

/**
 * Push an event to the data layer. Also sends to Meta Pixel (fbq) when loaded.
 * Use standard Facebook event names: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase.
 */
export function pushDataLayer(event: string, params?: Record<string, unknown>): void {
  ensureDataLayer();
  window.dataLayer.push({
    event,
    ...params,
  });
  // Send to Meta Pixel when loaded (from admin settings)
  if (typeof window !== "undefined" && window.fbq) {
    const { event_id, ...rest } = (params ?? {}) as Record<string, unknown> & { event_id?: string };
    const fbqParams = Object.keys(rest).length > 0 ? rest : undefined;
    if (event_id && typeof event_id === "string") {
      window.fbq("track", event, fbqParams, { eventID: event_id });
    } else {
      window.fbq("track", event, fbqParams);
    }
  }
}

/** PageView – fire on every page (or route change in SPA) */
export function trackPageView(path?: string, title?: string): void {
  pushDataLayer("PageView", {
    page_path: path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    page_title: title,
  });
}

/** ViewContent – product detail view */
export function trackViewContent(payload: {
  content_ids: string[];
  content_type?: "product";
  content_name?: string;
  value?: number;
  currency?: string;
}): void {
  pushDataLayer("ViewContent", {
    content_ids: payload.content_ids,
    content_type: payload.content_type ?? "product",
    content_name: payload.content_name,
    value: payload.value,
    currency: payload.currency ?? DEFAULT_CURRENCY,
  });
}

/** AddToCart – when user adds item to cart */
export function trackAddToCart(payload: {
  content_ids: string[];
  content_type?: "product";
  content_name?: string;
  value: number;
  currency?: string;
  num_items?: number;
}): void {
  pushDataLayer("AddToCart", {
    content_ids: payload.content_ids,
    content_type: payload.content_type ?? "product",
    content_name: payload.content_name,
    value: payload.value,
    currency: payload.currency ?? DEFAULT_CURRENCY,
    num_items: payload.num_items ?? 1,
  });
}

/** InitiateCheckout – when user lands on checkout with items */
export function trackInitiateCheckout(payload: {
  value: number;
  currency?: string;
  num_items: number;
  content_ids?: string[];
}): void {
  pushDataLayer("InitiateCheckout", {
    value: payload.value,
    currency: payload.currency ?? DEFAULT_CURRENCY,
    num_items: payload.num_items,
    content_ids: payload.content_ids ?? [],
  });
}

/** Purchase – order placed successfully (fire on thank-you / order confirmation page).
 * Pass event_id (e.g. order_id) so Meta Pixel can send eventID for deduplication with Conversions API. */
export function trackPurchase(payload: {
  order_id: string;
  value: number;
  currency?: string;
  num_items?: number;
  content_ids?: string[];
  event_id?: string;
}): void {
  pushDataLayer("Purchase", {
    order_id: payload.order_id,
    value: payload.value,
    currency: payload.currency ?? DEFAULT_CURRENCY,
    num_items: payload.num_items,
    content_ids: payload.content_ids ?? [],
    ...(payload.event_id && { event_id: payload.event_id }),
  });
}

/** Optional: Search – if you add search results page */
export function trackSearch(searchString: string): void {
  pushDataLayer("Search", {
    search_string: searchString,
  });
}
