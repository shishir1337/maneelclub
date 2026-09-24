"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/reviews-shared";
import { ReviewCard } from "./review-card";
import { ReviewLightbox } from "./review-lightbox";

interface ReviewsGridProps {
  reviews: Review[];
  /** How many screenshots to show before "Show more". Defaults to all. */
  initialCount?: number;
  /** How many more to reveal per click. */
  pageSize?: number;
  /** Tailwind column classes; masonry is done with CSS columns so heights can vary. */
  columnsClassName?: string;
  sizes?: string;
}

/** Masonry wall of screenshots with a lightbox and optional "Show more". */
export function ReviewsGrid({
  reviews,
  initialCount,
  pageSize = 12,
  columnsClassName = "columns-2 sm:columns-3 lg:columns-4",
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: ReviewsGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount ?? reviews.length);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (reviews.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No reviews to show yet. Screenshots the client uploads will appear here.
      </p>
    );
  }

  const visible = reviews.slice(0, visibleCount);
  const remaining = reviews.length - visible.length;

  return (
    <>
      <div className={cn(columnsClassName, "gap-4 [&>*]:mb-4")}>
        {visible.map((review, index) => (
          <ReviewCard
            key={review.id}
            review={review}
            onOpen={() => setOpenIndex(index)}
            sizes={sizes}
            priority={index < 4}
          />
        ))}
      </div>
      {remaining > 0 && (
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount((count) => count + pageSize)}
          >
            Show more reviews ({remaining} left)
          </Button>
        </div>
      )}
      <ReviewLightbox reviews={visible} openIndex={openIndex} onOpenChange={setOpenIndex} />
    </>
  );
}
