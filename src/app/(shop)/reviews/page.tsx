import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { TRUST_NUMBERS, getActiveReviews } from "@/lib/reviews-static";
import { ReviewsGrid } from "@/components/reviews";

export const metadata: Metadata = {
  title: `Customer Reviews | ${siteConfig.name}`,
  description: `Screenshots of real messages from ${siteConfig.name} customers after their parcel arrived. Over ${TRUST_NUMBERS.customers} customers across Bangladesh.`,
};

export default function ReviewsPage() {
  const reviews = getActiveReviews();

  return (
    <div className="container py-8 md:py-12">
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Home</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Reviews</span>
      </nav>

      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold">What customers sent us</h1>
        <p className="mt-4 text-muted-foreground">
          Over {TRUST_NUMBERS.customers} customers have shopped with {siteConfig.name}, most of
          them paying on delivery. Below are {TRUST_NUMBERS.screenshotReviews} screenshots of the
          messages they sent on WhatsApp, Messenger and Facebook after their parcel arrived, shared
          with their permission.
        </p>
      </header>

      <ReviewsGrid reviews={reviews} initialCount={12} pageSize={12} />
    </div>
  );
}
