"use client";

import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/reviews-static";
import { ReviewCard } from "./review-card";
import { ReviewLightbox } from "./review-lightbox";

interface ReviewsCarouselProps {
  reviews: Review[];
  /** Tailwind basis classes controlling how many screenshots are visible per row. */
  itemClassName?: string;
  sizes?: string;
}

// Arrows sit inside the carousel edges on every screen size and fade out at either end.
const arrowClassName =
  "z-10 size-10 border-0 bg-background/90 shadow-md backdrop-blur hover:bg-background disabled:pointer-events-none disabled:opacity-0";

/** Horizontal row of screenshots in an even 9:16 frame, with left/right arrows. */
export function ReviewsCarousel({
  reviews,
  itemClassName = "basis-[62%] sm:basis-[40%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5",
  sizes = "(max-width: 640px) 62vw, (max-width: 768px) 40vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw",
}: ReviewsCarouselProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (reviews.length === 0) return null;

  return (
    <>
      <Carousel opts={{ align: "start" }} className="w-full">
        <CarouselContent className="-ml-3 md:-ml-4">
          {reviews.map((review, index) => (
            <CarouselItem key={review.id} className={cn("pl-3 md:pl-4", itemClassName)}>
              <ReviewCard
                review={review}
                layout="framed"
                onOpen={() => setOpenIndex(index)}
                sizes={sizes}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className={cn(arrowClassName, "left-2")} />
        <CarouselNext className={cn(arrowClassName, "right-2")} />
      </Carousel>
      <ReviewLightbox reviews={reviews} openIndex={openIndex} onOpenChange={setOpenIndex} />
    </>
  );
}
