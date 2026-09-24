import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { siteConfig } from "@/lib/constants";
import { getActiveReviews, getSocialProofSettings } from "@/lib/reviews";
import { ReviewsGrid } from "@/components/reviews";

export async function generateMetadata(): Promise<Metadata> {
  const { customerCount } = await getSocialProofSettings();
  return {
    title: `Customer Reviews | ${siteConfig.name}`,
    description: `Screenshots of real messages from ${siteConfig.name} customers after their parcel arrived. Over ${customerCount} customers across Bangladesh.`,
  };
}

export default async function ReviewsPage() {
  const [reviews, { customerCount }] = await Promise.all([getActiveReviews(), getSocialProofSettings()]);

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
          Over {customerCount} customers have shopped with {siteConfig.name}, most of them paying on
          delivery. Below are messages and photos they sent us after their parcel arrived.
        </p>
      </header>

      <ReviewsGrid reviews={reviews} initialCount={12} pageSize={12} />
    </div>
  );
}
