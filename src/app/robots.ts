import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/constants";

/**
 * Generates a valid robots.txt per the Robots Exclusion Standard.
 * Only standard directives (User-Agent, Allow, Disallow, Sitemap) are used.
 * Non-standard directives (e.g. Content-Signal) are not supported and cause validation errors.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dashboard/", "/sign-in", "/sign-up"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
