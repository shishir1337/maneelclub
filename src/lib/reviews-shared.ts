/**
 * Review / social-proof types and pure helpers. Client-safe: no database access here.
 * Server reads live in lib/reviews.ts; admin writes in actions/admin/reviews.ts.
 */

export const REVIEW_SOURCES = ["MESSENGER", "INSTAGRAM", "FACEBOOK", "WHATSAPP", "PHOTO", "OTHER"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

/** A customer screenshot as the storefront needs it. */
export interface Review {
  id: string;
  image: string;
  width: number;
  height: number;
  /** Not shown on the page; describes the screenshot for screen readers and search engines. */
  caption: string;
  customerName: string;
  source: ReviewSource;
  /** Home page carousel and product-tab fallback. */
  isFeatured: boolean;
  /** Products this screenshot is about. Empty means a general review. */
  productIds: string[];
}

export const SOURCE_META: Record<ReviewSource, { label: string }> = {
  MESSENGER: { label: "Messenger" },
  INSTAGRAM: { label: "Instagram" },
  FACEBOOK: { label: "Facebook" },
  WHATSAPP: { label: "WhatsApp" },
  PHOTO: { label: "Customer photo" },
  OTHER: { label: "Customer message" },
};

/** Alt text for a screenshot. */
export function reviewAltText(review: Pick<Review, "source" | "customerName" | "caption">): string {
  const who = review.customerName.trim() || "a customer";
  const kind = review.source === "PHOTO" ? "Customer photo" : `${SOURCE_META[review.source].label} message`;
  const caption = review.caption.trim();
  return caption ? `${kind} from ${who}: ${caption}` : `${kind} from ${who}`;
}

/**
 * Screenshots for a product page: ones tagged with the product first, then featured general
 * ones so the tab never looks empty. Input order (admin sort order) is preserved in each group.
 */
export function pickReviewsForProduct(all: Review[], productId: string, limit: number): Review[] {
  const tagged = all.filter((r) => r.productIds.includes(productId));
  const featured = all.filter((r) => r.isFeatured && !r.productIds.includes(productId));
  return [...tagged, ...featured].slice(0, limit);
}

export interface SocialProofSettings {
  customerCount: string;
  ordersDelivered: string;
  homeEnabled: boolean;
  productTabEnabled: boolean;
  trustLineEnabled: boolean;
}

export const SOCIAL_PROOF_DEFAULTS = {
  reviewsCustomerCount: "10,000+",
  reviewsOrdersDelivered: "8,800+",
  reviewsHomeEnabled: "true",
  reviewsProductTabEnabled: "true",
  reviewsTrustLineEnabled: "true",
} as const;

/** Read the social-proof settings from the raw settings map, falling back to defaults. */
export function buildSocialProofSettings(settings: Record<string, string | undefined>): SocialProofSettings {
  const text = (key: keyof typeof SOCIAL_PROOF_DEFAULTS) =>
    (settings[key] ?? "").trim() || SOCIAL_PROOF_DEFAULTS[key];
  const flag = (key: keyof typeof SOCIAL_PROOF_DEFAULTS) => text(key) !== "false";
  return {
    customerCount: text("reviewsCustomerCount"),
    ordersDelivered: text("reviewsOrdersDelivered"),
    homeEnabled: flag("reviewsHomeEnabled"),
    productTabEnabled: flag("reviewsProductTabEnabled"),
    trustLineEnabled: flag("reviewsTrustLineEnabled"),
  };
}
