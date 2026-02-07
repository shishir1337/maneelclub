"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  if (!slides.length) return null;

  return (
    <section className="w-full">
      <Carousel
        opts={{
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide) => (
            <CarouselItem key={slide.id}>
              {slide.link ? (
                <Link href={slide.link} className="block">
                  <div className="relative aspect-[2.2/1] sm:aspect-[2.7/1] lg:aspect-[3.2/1] w-full overflow-hidden">
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      priority
                      unoptimized={slide.image.startsWith("/uploads/")}
                    />
                  </div>
                </Link>
              ) : (
                <div className="relative aspect-[2.2/1] sm:aspect-[2.7/1] lg:aspect-[3.2/1] w-full overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    priority
                    unoptimized={slide.image.startsWith("/uploads/")}
                  />
                </div>
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 md:left-4" />
        <CarouselNext className="right-2 md:right-4" />
      </Carousel>
    </section>
  );
}
