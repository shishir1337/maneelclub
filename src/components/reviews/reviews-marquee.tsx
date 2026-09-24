"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/reviews-static";
import { ReviewCard } from "./review-card";
import { ReviewLightbox } from "./review-lightbox";

interface ReviewsMarqueeProps {
  reviews: Review[];
  /** Width of each screenshot card (Tailwind classes). Height follows the 9:16 frame. */
  cardClassName?: string;
  sizes?: string;
  /** Seconds each card takes to pass; the row duration scales with the number of cards. */
  secondsPerCard?: number;
  className?: string;
}

/** Minimum cards per row before the loop is duplicated, so wide screens never show a gap. */
const MIN_CARDS_PER_ROW = 8;

type Row = { items: Array<{ review: Review; index: number }>; uniqueCount: number };

/** Repeat a row's reviews until it has enough cards; remember how many are originals. */
function fillRow(items: Array<{ review: Review; index: number }>): Row {
  const filled = [...items];
  while (items.length > 0 && filled.length < MIN_CARDS_PER_ROW) filled.push(...items);
  return { items: filled, uniqueCount: items.length };
}

/**
 * Two endlessly scrolling rows of screenshots: the top row drifts left, the bottom row right.
 * Edges fade out with a mask. Hovering, focusing or opening a screenshot pauses both rows.
 * Each row renders its list twice and slides by half its width for a seamless loop.
 */
export function ReviewsMarquee({
  reviews,
  cardClassName = "w-[150px] sm:w-[180px] md:w-[210px]",
  sizes = "(max-width: 640px) 150px, (max-width: 768px) 180px, 210px",
  secondsPerCard = 5,
  className,
}: ReviewsMarqueeProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (reviews.length === 0) return null;

  const indexed = reviews.map((review, index) => ({ review, index }));
  const rows =
    reviews.length < 4
      ? [fillRow(indexed)]
      : [
          fillRow(indexed.filter((_, i) => i % 2 === 0)),
          fillRow(indexed.filter((_, i) => i % 2 === 1)),
        ];

  return (
    <>
      <div
        className={cn("review-marquee space-y-4", className)}
        data-paused={openIndex !== null}
      >
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="review-marquee-track flex w-max"
            data-direction={rowIndex % 2 === 0 ? "left" : "right"}
            style={{ "--marquee-duration": `${row.items.length * secondsPerCard}s` } as React.CSSProperties}
          >
            {[0, 1].map((copy) =>
              row.items.map(({ review, index }, position) => {
                // Repeats only exist to make the loop seamless; keep them out of assistive tech and tab order.
                const isRepeat = copy === 1 || position >= row.uniqueCount;
                return (
                <div
                  key={`${copy}-${position}-${review.id}`}
                  className={cn("shrink-0 pr-4", cardClassName)}
                  aria-hidden={isRepeat || undefined}
                  inert={isRepeat || undefined}
                >
                  <ReviewCard
                    review={review}
                    layout="framed"
                    onOpen={() => setOpenIndex(index)}
                    sizes={sizes}
                  />
                </div>
                );
              })
            )}
          </div>
        ))}
      </div>
      <ReviewLightbox reviews={reviews} openIndex={openIndex} onOpenChange={setOpenIndex} />
    </>
  );
}
