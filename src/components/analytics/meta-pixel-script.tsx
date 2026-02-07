"use client";

import Script from "next/script";

/** fbq injected by Meta Pixel script - init('pixelId') and track('PageView') */
type Fbq = ((action: "init", pixelId: string) => void) & ((action: "track", eventName: string, params?: object, opts?: { eventID?: string }) => void);

/**
 * Loads Meta Pixel base script when pixelId is set and enabled.
 * Configure in Admin → Settings → Tracking.
 */
interface MetaPixelScriptProps {
  pixelId: string;
  enabled: boolean;
}

export function MetaPixelScript({ pixelId, enabled }: MetaPixelScriptProps) {
  if (!enabled || !pixelId.trim()) return null;

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      src="https://connect.facebook.net/en_US/fbevents.js"
      onLoad={() => {
        const fbq = (typeof window !== "undefined" && (window as { fbq?: Fbq }).fbq) as Fbq | undefined;
        if (fbq) {
          fbq("init", pixelId);
          fbq("track", "PageView");
        }
      }}
    />
  );
}
