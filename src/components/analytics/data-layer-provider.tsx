"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/data-layer";

/**
 * Initializes window.dataLayer and pushes PageView on route change.
 * Wrap the app (e.g. in Providers) so Meta Pixel / GTM can track page views.
 */
export function DataLayerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    trackPageView(pathname ?? window.location.pathname, document.title);
  }, [pathname]);

  return <>{children}</>;
}
