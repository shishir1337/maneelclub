"use client";

import Image from "next/image";
import { SOURCE_META, reviewAltText, type Review } from "@/lib/reviews-static";

interface ReviewCardProps {
  review: Review;
  onOpen: () => void;
  /** next/image sizes hint for the layout this card sits in. */
  sizes: string;
  priority?: boolean;
}

/**
 * A customer screenshot framed like a phone capture, at its natural height,
 * with the customer's name and a short quote beneath. Click opens the lightbox.
 */
export function ReviewCard({ review, onOpen, sizes, priority = false }: ReviewCardProps) {
  const source = SOURCE_META[review.source];

  return (
    <figure className="break-inside-avoid">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full overflow-hidden rounded-2xl border bg-muted/40 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Open screenshot from ${review.customerName}`}
      >
        <Image
          src={review.image}
          alt={reviewAltText(review)}
          width={review.width}
          height={review.height}
          sizes={sizes}
          priority={priority}
          className="h-auto w-full"
        />
      </button>
      <figcaption className="mt-2 px-1 text-sm leading-snug">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: source.color }}
          />
          {source.label}
          {review.location && <span>, {review.location}</span>}
        </span>
        <span className="mt-0.5 block">
          <span className="font-medium">{review.customerName}</span>{" "}
          <span className="text-muted-foreground">{review.caption}</span>
        </span>
      </figcaption>
    </figure>
  );
}
