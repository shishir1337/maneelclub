import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHomeReviews, getSocialProofSettings } from "@/lib/reviews";
import { ReviewsMarquee } from "./reviews-marquee";

/**
 * Home page social proof: the customer count as a sentence, one line of context, then two rows
 * of real screenshots. Managed in Admin → Reviews; hidden when switched off or when empty.
 */
export async function SocialProofSection() {
  const [settings, reviews] = await Promise.all([getSocialProofSettings(), getHomeReviews()]);
  if (!settings.homeEnabled || reviews.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold">{settings.homeHeading}</h2>
            {settings.homeDescription && (
              <p className="mt-3 text-muted-foreground">{settings.homeDescription}</p>
            )}
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
      {/* All screen sizes: two full-bleed rows drifting in opposite directions, faded at the sides. */}
      <ReviewsMarquee reviews={reviews} />
    </section>
  );
}
