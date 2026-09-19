"use client";

import { useEffect } from "react";
import { resolveTouch } from "@/lib/attribution";
import { useAttributionStore } from "@/store/attribution-store";

/**
 * Records where the visitor came from, so it can be saved with their order.
 *
 * Runs on every route change, but resolveTouch returns null for internal navigation
 * (referrer is our own host, no campaign params), so the original source is preserved.
 *
 * Reads window.location.search rather than useSearchParams() on purpose: the latter
 * requires a Suspense boundary and would opt every page out of static rendering.
 * Wrapped in try/catch - attribution must never break the page.
 */
export function AttributionProvider({ children }: { children: React.ReactNode }) {
  const record = useAttributionStore((state) => state.record);

  // Mount-only on purpose. A genuine new arrival is always a fresh document load,
  // which remounts this provider. Re-running on route change would misread internal
  // navigation (no params, no referrer) as a new "direct" visit and overwrite the
  // real source - which is exactly what happens in the Meta/TikTok in-app browsers
  // where the referrer is stripped.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const search = window.location.search;
      const landing = `${window.location.pathname}${search}`;
      const touch = resolveTouch(
        search,
        document.referrer || "",
        landing,
        window.location.hostname
      );
      record(touch);
    } catch {
      // Analytics only - never surface or block on failure.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
