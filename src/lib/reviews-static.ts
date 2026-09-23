/**
 * Static review data for the social-proof UI.
 *
 * TEMPORARY: this file stands in for the future Review table and the Social Proof settings
 * so the frontend can be finalised first. Shapes here are the ones the admin will manage:
 * every field maps to a planned column or setting. Images are text-free placeholder
 * screenshots in /public/reviews, to be replaced by real uploads on ImageKit.
 */

export type ReviewSource = "whatsapp" | "messenger" | "facebook";

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
};

const PLACEHOLDERS: Array<{ file: string; height: number; source: ReviewSource }> = [
  { file: "placeholder-01.png", height: 780, source: "whatsapp" },
  { file: "placeholder-02.png", height: 900, source: "messenger" },
  { file: "placeholder-03.png", height: 720, source: "facebook" },
  { file: "placeholder-04.png", height: 980, source: "whatsapp" },
  { file: "placeholder-05.png", height: 760, source: "messenger" },
  { file: "placeholder-06.png", height: 860, source: "whatsapp" },
  { file: "placeholder-07.png", height: 940, source: "facebook" },
  { file: "placeholder-08.png", height: 700, source: "messenger" },
  { file: "placeholder-09.png", height: 920, source: "whatsapp" },
  { file: "placeholder-10.png", height: 800, source: "facebook" },
  { file: "placeholder-11.png", height: 840, source: "messenger" },
  { file: "placeholder-12.png", height: 740, source: "whatsapp" },
];

const SAMPLE_REVIEWS: Array<Pick<Review, "customerName" | "location" | "caption">> = [
  { customerName: "Tanvir A.", location: "Dhaka", caption: "Got the hoodie today. Fabric is really soft, exactly like the photos." },
  { customerName: "Nusrat J.", location: "Chattogram", caption: "Delivery was faster than expected. Size L fits perfectly." },
  { customerName: "Rafiq H.", location: "Sylhet", caption: "Second order from you. Same quality as the first one, thank you." },
  { customerName: "Sadia I.", location: "Khulna", caption: "Colour is the same as on the site. My brother wants one now." },
  { customerName: "Mehedi H.", location: "Rajshahi", caption: "Paid on delivery, no hassle. The polo is great for office." },
  { customerName: "Farzana K.", location: "Narayanganj", caption: "Ordered three t-shirts as gifts. Everyone loved them." },
  { customerName: "Imran S.", location: "Cumilla", caption: "Stitching is neat and the print has not faded after washing." },
  { customerName: "Sumaiya R.", location: "Gazipur", caption: "Customer service replied within minutes and helped me with sizing." },
  { customerName: "Arif M.", location: "Barishal", caption: "Received in two days outside Dhaka. Packaging was good." },
  { customerName: "Jannat F.", location: "Mymensingh", caption: "The winter collection jacket is warm and looks premium." },
  { customerName: "Shakib K.", location: "Bogura", caption: "Exchange for a bigger size was smooth. Will order again." },
  { customerName: "Ruma A.", location: "Dhaka", caption: "Bought for my husband, he wears it every weekend now." },
  { customerName: "Nayeem R.", location: "Rangpur", caption: "Best hoodie I have bought online in Bangladesh so far." },
  { customerName: "Tasnim H.", location: "Dhaka", caption: "Fits true to size. The size chart on the page was accurate." },
  { customerName: "Sabbir A.", location: "Feni", caption: "Parcel arrived well packed and the fabric feels durable." },
  { customerName: "Mim S.", location: "Jashore", caption: "Loved the colour options. Ordered black and olive." },
  { customerName: "Rakib U.", location: "Dhaka", caption: "Great value for the price. Already recommended to friends." },
  { customerName: "Priya D.", location: "Chattogram", caption: "Very comfortable for daily wear, no itching at all." },
  { customerName: "Hasan M.", location: "Tangail", caption: "Delivery man called before coming. Product as described." },
  { customerName: "Lamia N.", location: "Dhaka", caption: "The thread quality is better than brands twice the price." },
  { customerName: "Fahim R.", location: "Sylhet", caption: "Third time ordering. Consistent quality every time." },
  { customerName: "Anika T.", location: "Kushtia", caption: "Perfect fit and the colour has not faded after a month." },
  { customerName: "Sohel K.", location: "Dhaka", caption: "Fast reply on WhatsApp and honest about the delivery date." },
  { customerName: "Maliha Z.", location: "Noakhali", caption: "My whole family ordered after seeing mine. Thank you." },
];

/** 24 sample reviews cycling through the 12 placeholder screenshots. */
export const STATIC_REVIEWS: Review[] = SAMPLE_REVIEWS.map((sample, index) => {
  const placeholder = PLACEHOLDERS[index % PLACEHOLDERS.length];
  return {
    id: `static-${index + 1}`,
    image: `/reviews/${placeholder.file}`,
    width: 600,
    height: placeholder.height,
    caption: sample.caption,
    customerName: sample.customerName,
    location: sample.location,
    source: placeholder.source,
    productSlugs: [],
    isFeatured: index < 10,
    isActive: true,
    sortOrder: index,
  };
});

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
  return `${SOURCE_META[review.source].label} message from ${review.customerName}${where}: ${review.caption}`;
}
