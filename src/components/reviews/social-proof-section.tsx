import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TRUST_NUMBERS, getActiveReviews, getFeaturedReviews } from "@/lib/reviews-static";
import { ReviewsMarquee } from "./reviews-marquee";

/**
 * Home page social proof: the customer count as a sentence, one line of context,
 * then a wall of real screenshots. Server component; data will come from the DB later.
 */
export function SocialProofSection() {
  // Two rows need a healthy pool, so use every active review, featured ones first.
  const featured = getFeaturedReviews(100);
  const reviews = [...featured, ...getActiveReviews().filter((r) => !r.isFeatured)];

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold">
              Over {TRUST_NUMBERS.customers.replace("+", "")} customers have shopped with us
            </h2>
            <p className="mt-3 text-muted-foreground">
              More than {TRUST_NUMBERS.ordersDelivered} orders delivered, cash on delivery in every
              district. These are the messages customers send us after their parcel arrives.
            </p>
          </div>
          <Link
            href="/reviews"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
            aria-label="See all customer reviews"
          >
            See all reviews
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {/* Full-bleed so the rows run edge to edge and fade out at the screen sides. */}
      <ReviewsMarquee reviews={reviews} />
    </section>
  );
}
