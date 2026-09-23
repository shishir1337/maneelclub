"use client";

import { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Review } from "@/lib/reviews-static";
import { ReviewCard } from "./review-card";
import { ReviewLightbox } from "./review-lightbox";

interface ReviewsCarouselProps {
  reviews: Review[];
}

/** Horizontal, drag-free row of screenshots for the home page. */
export function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (reviews.length === 0) return null;

  return (
    <>
      <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
        <CarouselContent className="-ml-4 items-start">
          {reviews.map((review, index) => (
            <CarouselItem
              key={review.id}
              className="basis-[68%] pl-4 sm:basis-[44%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5"
            >
              <ReviewCard
                review={review}
                onOpen={() => setOpenIndex(index)}
                sizes="(max-width: 640px) 68vw, (max-width: 768px) 44vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:inline-flex" />
        <CarouselNext className="hidden md:inline-flex" />
      </Carousel>
      <ReviewLightbox reviews={reviews} openIndex={openIndex} onOpenChange={setOpenIndex} />
    </>
  );
}
