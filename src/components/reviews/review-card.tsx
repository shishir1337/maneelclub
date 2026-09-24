"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { reviewAltText, type Review } from "@/lib/reviews-static";

interface ReviewCardProps {
  review: Review;
  onOpen: () => void;
  /** next/image sizes hint for the layout this card sits in. */
  sizes: string;
  priority?: boolean;
  /**
   * "natural" keeps the screenshot's own height (masonry wall).
   * "framed" fits every screenshot into the same 9:16 frame, cropped from the centre,
   * so a row of mixed sizes lines up evenly (carousels). Clicking still shows it uncropped.
   */
  layout?: "natural" | "framed";
}

/** A customer screenshot framed like a phone capture. Click opens the full image in the lightbox. */
export function ReviewCard({ review, onOpen, sizes, priority = false, layout = "natural" }: ReviewCardProps) {
  const framed = layout === "framed";

  return (
    <figure className="break-inside-avoid">
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "block w-full overflow-hidden rounded-2xl border bg-muted/40 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          framed && "relative aspect-[9/16]"
        )}
        aria-label={`Open screenshot from ${review.customerName}`}
      >
        {framed ? (
          <Image
            src={review.image}
            alt={reviewAltText(review)}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover object-center"
          />
        ) : (
          <Image
            src={review.image}
            alt={reviewAltText(review)}
            width={review.width}
            height={review.height}
            sizes={sizes}
            priority={priority}
            className="h-auto w-full"
          />
        )}
      </button>
    </figure>
  );
}
