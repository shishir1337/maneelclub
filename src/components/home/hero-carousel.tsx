"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  id: string;
  image: string;
  alt: string;
  link: string | null;
};

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplayControlRef = useRef<{
    stop: () => void;
    resume: () => void;
  } | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    // Defer initial sync to avoid "setState synchronously within an effect" warning
    queueMicrotask(() => setCurrent(api.selectedScrollSnap()));

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Auto-play: Change slide every 3 seconds
  useEffect(() => {
    if (!api || slides.length <= 1) {
      return;
    }

    let autoplayInterval: NodeJS.Timeout | null = null;
    let resumeTimeout: NodeJS.Timeout | null = null;

    const startAutoplay = () => {
      // Clear any existing interval
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
      autoplayInterval = setInterval(() => {
        api.scrollNext();
      }, 3000); // 3 seconds
    };

    const stopAutoplay = () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
      // Clear any pending resume timeout
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
        resumeTimeout = null;
      }
    };

    const resumeAutoplay = () => {
      stopAutoplay();
      // Resume after 5 seconds of no interaction
      resumeTimeout = setTimeout(() => {
        startAutoplay();
      }, 5000);
    };

    // Store control functions in ref for dot click handler
    autoplayControlRef.current = {
      stop: stopAutoplay,
      resume: resumeAutoplay,
    };

    // Start autoplay
    startAutoplay();

    // Get the carousel container element
    const container = carouselRef.current;
    if (!container) {
      return;
    }

    // Pause autoplay on user interaction
    const handlePointerDown = () => stopAutoplay();
    const handlePointerUp = resumeAutoplay;
    const handleTouchStart = () => stopAutoplay();
    const handleTouchEnd = resumeAutoplay;

    // Pause on hover (desktop)
    const handleMouseEnter = () => stopAutoplay();
    const handleMouseLeave = () => startAutoplay();

    // Listen for user interactions
    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      stopAutoplay();
      if (resumeTimeout) {
        clearTimeout(resumeTimeout);
      }
      if (container) {
        container.removeEventListener("pointerdown", handlePointerDown);
        container.removeEventListener("pointerup", handlePointerUp);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchend", handleTouchEnd);
        container.removeEventListener("mouseenter", handleMouseEnter);
        container.removeEventListener("mouseleave", handleMouseLeave);
      }
      autoplayControlRef.current = null;
    };
  }, [api, slides.length]);

  if (!slides.length) return null;

  return (
    <section ref={carouselRef} className="w-full relative">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide, index) => {
            const isLcp = index === 0;
            return (
              <CarouselItem key={slide.id}>
                {slide.link ? (
                  <Link href={slide.link} className="block">
                    <div className="relative aspect-[2.2/1] sm:aspect-[2.7/1] lg:aspect-[3.2/1] w-full overflow-hidden">
                      <Image
                        src={slide.image}
                        alt={slide.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
                        className="object-cover"
                        quality={95}
                        priority={isLcp}
                        fetchPriority={isLcp ? "high" : undefined}
                        loading={isLcp ? undefined : "lazy"}
                      />
                    </div>
                  </Link>
                ) : (
                  <div className="relative aspect-[2.2/1] sm:aspect-[2.7/1] lg:aspect-[3.2/1] w-full overflow-hidden">
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1920px"
                      className="object-cover"
                      quality={95}
                      priority={isLcp}
                      fetchPriority={isLcp ? "high" : undefined}
                      loading={isLcp ? undefined : "lazy"}
                    />
                  </div>
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
      
      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                api?.scrollTo(index);
                // Pause autoplay when user clicks a dot, then resume after delay
                autoplayControlRef.current?.stop();
                autoplayControlRef.current?.resume();
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                current === index
                  ? "w-8 bg-primary"
                  : "w-2 bg-white/60 hover:bg-white/80"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
