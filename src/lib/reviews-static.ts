/**
 * Static review data for the social-proof UI.
 *
 * TEMPORARY: this file stands in for the future Review table and the Social Proof settings
 * so the frontend can be finalised first. Shapes here are the ones the admin will manage:
 * every field maps to a planned column or setting. Images are text-free placeholder
 * screenshots in /public/reviews, to be replaced by real uploads on ImageKit.
 */

export type ReviewSource = "whatsapp" | "messenger" | "facebook" | "instagram" | "photo";

export interface Review {
  id: string;
  /** Screenshot URL. Real uploads will be ImageKit URLs; width/height come from the upload response. */
  image: string;
  width: number;
  height: number;
  /** Short quote or summary shown under the screenshot and used for alt text. */
  caption: string;
  /** Display name as the client wants it shown, e.g. "Tanvir A." */
  customerName: string;
  /** Optional city, shown after the name. */
  location?: string;
  source: ReviewSource;
  /** Product slugs this screenshot talks about. Empty means a general review. */
  productSlugs: string[];
  /** Featured reviews appear on the home page carousel and as the product-tab fallback. */
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
}

/** Trust numbers the client controls. Will move to Settings (Social Proof card). */
export const TRUST_NUMBERS = {
  customers: "10,000+",
  ordersDelivered: "8,800+",
  screenshotReviews: "100+",
} as const;

export const SOURCE_META: Record<ReviewSource, { label: string; color: string }> = {
  whatsapp: { label: "WhatsApp", color: "#25D366" },
  messenger: { label: "Messenger", color: "#0084FF" },
  facebook: { label: "Facebook", color: "#1877F2" },
  instagram: { label: "Instagram", color: "#C13584" },
  photo: { label: "Customer photo", color: "#737373" },
};

/**
 * Real customer screenshots in /public/reviews, in display order. Captions are short English
 * summaries of what the customer wrote (most messages are in Banglish).
 */
const REAL_REVIEWS: Array<
  Pick<Review, "customerName" | "caption" | "source" | "width" | "height" | "isFeatured"> & { file: string }
> = [
  { file: "IMG_0381.JPG.jpeg", width: 720, height: 1600, source: "messenger", customerName: "Mehdiur R.", caption: "Got the muscle tees from you. Excellent quality, very happy with the product.", isFeatured: true },
  { file: "IMG_0058.JPG.jpeg", width: 720, height: 1600, source: "photo", customerName: "Customer", caption: "Wearing the henley tee they ordered.", isFeatured: true },
  { file: "IMG_0059.JPG.jpeg", width: 720, height: 1600, source: "messenger", customerName: "Johny K.", caption: "I believe in Maneel quality, already bought 3 henley t-shirts. Ordering again.", isFeatured: true },
  { file: "IMG_0348.PNG", width: 1242, height: 2688, source: "messenger", customerName: "Alif K.", caption: "Got the product, quality is very good. Exactly what I expected at this price.", isFeatured: true },
  { file: "IMG_0377.JPG.jpeg", width: 773, height: 1280, source: "photo", customerName: "Customer", caption: "Ringer tee, sent to us after delivery.", isFeatured: true },
  { file: "IMG_0062.JPG.jpeg", width: 720, height: 1600, source: "messenger", customerName: "A customer", caption: "Satisfied with the quality and texture. Really happy with the design and the fabric.", isFeatured: true },
  { file: "IMG_0387.JPG.jpeg", width: 576, height: 1280, source: "messenger", customerName: "Arpon O.", caption: "Product quality is very good. I am satisfied.", isFeatured: true },
  { file: "IMG_0378.JPG.jpeg", width: 576, height: 1280, source: "instagram", customerName: "Alif", caption: "The product is great, really happy with it.", isFeatured: true },
  { file: "IMG_0384.JPG.jpeg", width: 960, height: 1280, source: "photo", customerName: "Customer", caption: "Full sleeve henley, sent to us after delivery.", isFeatured: true },
  { file: "IMG_0380.JPG.jpeg", width: 576, height: 1280, source: "messenger", customerName: "Adit Q.", caption: "The product is very good. Should have ordered a half sleeve too.", isFeatured: true },
  { file: "IMG_0385.JPG.jpeg", width: 720, height: 1600, source: "instagram", customerName: "Hazzaz", caption: "Your product looks really beautiful. Thank you.", isFeatured: false },
  { file: "IMG_0388.JPG.jpeg", width: 576, height: 1280, source: "messenger", customerName: "Araf A.", caption: "Sent us a photo wearing his order as a review.", isFeatured: false },
  { file: "IMG_0383.JPG.jpeg", width: 576, height: 1280, source: "messenger", customerName: "Efaz", caption: "Shared his photo in the tee. Thanks for your product.", isFeatured: false },
  { file: "IMG_0379.JPG.jpeg", width: 576, height: 1280, source: "instagram", customerName: "Mehebub", caption: "Tagged us in his story wearing the henley.", isFeatured: false },
];

export const STATIC_REVIEWS: Review[] = REAL_REVIEWS.map((r, index) => ({
  id: `static-${index + 1}`,
  image: `/reviews/${r.file}`,
  width: r.width,
  height: r.height,
  caption: r.caption,
  customerName: r.customerName,
  source: r.source,
  productSlugs: [],
  isFeatured: r.isFeatured,
  isActive: true,
  sortOrder: index,
}));

/** Active reviews in display order. */
export function getActiveReviews(): Review[] {
  return STATIC_REVIEWS.filter((r) => r.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Featured reviews for the home page carousel and product-tab fallback. */
export function getFeaturedReviews(limit = 10): Review[] {
  return getActiveReviews().filter((r) => r.isFeatured).slice(0, limit);
}

/**
 * Reviews for a product page: screenshots tagged with the product first, then featured general
 * ones so the tab never looks empty.
 */
export function getReviewsForProduct(slug: string, limit = 6): Review[] {
  const active = getActiveReviews();
  const tagged = active.filter((r) => r.productSlugs.includes(slug));
  const fallback = active.filter((r) => r.isFeatured && !r.productSlugs.includes(slug));
  return [...tagged, ...fallback].slice(0, limit);
}

/** Alt text that describes the screenshot for screen readers and search engines. */
export function reviewAltText(review: Review): string {
  const where = review.location ? ` from ${review.location}` : "";
  const kind = review.source === "photo" ? "Photo" : `${SOURCE_META[review.source].label} message`;
  return `${kind} from ${review.customerName}${where}: ${review.caption}`;
}
