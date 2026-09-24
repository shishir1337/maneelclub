"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { Review } from "@/lib/reviews-shared";
import { ReviewCard } from "./review-card";
import { ReviewLightbox } from "./review-lightbox";

interface ReviewsCarouselProps {
  reviews: Review[];
  /** Tailwind basis classes controlling how many screenshots are visible per row. */
  itemClassName?: string;
  sizes?: string;
  /** Milliseconds between automatic slides. 0 turns autoplay off. */
  autoplayMs?: number;
}

/** How long autoplay waits after the visitor touches or clicks the carousel before resuming. */
const RESUME_AFTER_INTERACTION_MS = 6000;

// Arrows sit inside the carousel edges on every screen size and fade out at either end.
const arrowClassName =
  "z-10 size-10 border-0 bg-background/90 shadow-md backdrop-blur hover:bg-background disabled:pointer-events-none disabled:opacity-0";

/** Horizontal row of screenshots in an even 9:16 frame, with left/right arrows. */
export function ReviewsCarousel({
  reviews,
  itemClassName = "basis-[62%] sm:basis-[40%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5",
  sizes = "(max-width: 640px) 62vw, (max-width: 768px) 40vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw",
  autoplayMs = 3500,
}: ReviewsCarouselProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pausedUntil, setPausedUntil] = useState(0);

  const paused = hovered || focused || openIndex !== null;

  // Autoplay: advance one slide every `autoplayMs`, returning to the start after the last one.
  useEffect(() => {
    if (!api || !autoplayMs || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (document.hidden || Date.now() < pausedUntil) return;
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, autoplayMs);
    return () => window.clearInterval(id);
  }, [api, autoplayMs, paused, pausedUntil]);

  // A swipe or drag counts as the visitor taking over; wait a while before sliding again.
  useEffect(() => {
    if (!api) return;
    const onPointerDown = () => setPausedUntil(Date.now() + RESUME_AFTER_INTERACTION_MS);
    api.on("pointerDown", onPointerDown);
    return () => {
      api.off("pointerDown", onPointerDown);
    };
  }, [api]);

  if (reviews.length === 0) return null;

  return (
    <>
      <Carousel
        opts={{ align: "start" }}
        setApi={setApi}
        className="w-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={(e) => setFocused((e.target as HTMLElement).matches(":focus-visible"))}
        onBlurCapture={() => setFocused(false)}
        onClickCapture={() => setPausedUntil(Date.now() + RESUME_AFTER_INTERACTION_MS)}
      >
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
