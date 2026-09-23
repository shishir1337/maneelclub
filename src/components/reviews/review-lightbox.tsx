"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SOURCE_META, reviewAltText, type Review } from "@/lib/reviews-static";

interface ReviewLightboxProps {
  reviews: Review[];
  /** Index into `reviews`, or null when closed. */
  openIndex: number | null;
  onOpenChange: (index: number | null) => void;
}

/** Full-size screenshot viewer with previous / next, including arrow-key navigation. */
export function ReviewLightbox({ reviews, openIndex, onOpenChange }: ReviewLightboxProps) {
  const review = openIndex != null ? reviews[openIndex] : null;
  const hasPrev = openIndex != null && openIndex > 0;
  const hasNext = openIndex != null && openIndex < reviews.length - 1;

  useEffect(() => {
    if (openIndex == null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" && openIndex! > 0) onOpenChange(openIndex! - 1);
      if (event.key === "ArrowRight" && openIndex! < reviews.length - 1) onOpenChange(openIndex! + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, reviews.length, onOpenChange]);

  return (
    <Dialog open={review != null} onOpenChange={(open) => !open && onOpenChange(null)}>
      <DialogContent className="max-w-[min(92vw,44rem)] gap-0 overflow-hidden p-0">
        {review && (
          <>
            <DialogTitle className="sr-only">
              Screenshot from {review.customerName}
            </DialogTitle>
            <div className="relative flex items-center justify-center bg-muted">
              <Image
                key={review.id}
                src={review.image}
                alt={reviewAltText(review)}
                width={review.width}
                height={review.height}
                sizes="(max-width: 768px) 92vw, 44rem"
                className="max-h-[75vh] w-auto max-w-full"
              />
              {hasPrev && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full shadow"
                  onClick={() => onOpenChange(openIndex! - 1)}
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              {hasNext && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full shadow"
                  onClick={() => onOpenChange(openIndex! + 1)}
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>
            <div className="space-y-1 border-t px-4 py-3 text-sm">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: SOURCE_META[review.source].color }}
                />
                {SOURCE_META[review.source].label}
                {review.location && <span>, {review.location}</span>}
                <span className="ml-auto tabular-nums">
                  {openIndex! + 1} of {reviews.length}
                </span>
              </p>
              <p>
                <span className="font-medium">{review.customerName}</span>{" "}
                <span className="text-muted-foreground">{review.caption}</span>
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
