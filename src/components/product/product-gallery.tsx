"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ZoomIn, ChevronLeft, ChevronRight, X } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Ensure we have at least one image. Use unoptimized for /uploads/ so production serves them (files added at runtime).
  const galleryImages = images.length > 0 ? images : ["/logo.png"];
  const isUpload = (src: string) => src.startsWith("/uploads/");

  const goPrev = useCallback(() => {
    setSelectedIndex((i) => (i <= 0 ? galleryImages.length - 1 : i - 1));
  }, [galleryImages.length]);

  const goNext = useCallback(() => {
    setSelectedIndex((i) => (i >= galleryImages.length - 1 ? 0 : i + 1));
  }, [galleryImages.length]);

  // Close lightbox on Escape, lock body scroll when open
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, goPrev, goNext]);

  return (
    <div className="space-y-3 w-full max-w-full overflow-hidden">
      {/* Main Image - hover zoom icon, click opens lightbox */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setLightboxOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLightboxOpen(true);
          }
        }}
        className="group relative aspect-square md:aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted cursor-zoom-in"
        aria-label="View image full screen"
      >
        <Image
          src={galleryImages[selectedIndex]}
          alt={`${title} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover object-top"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={isUpload(galleryImages[selectedIndex])}
        />
        {/* Zoom icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center w-12 h-12 rounded-full bg-background/90 text-foreground shadow-md">
            <ZoomIn className="h-6 w-6" aria-hidden />
          </div>
        </div>
      </div>

      {/* Thumbnails - horizontal scroll with hidden scrollbar */}
      {galleryImages.length > 1 && (
        <div className="w-full overflow-hidden">
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {galleryImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative aspect-square w-14 sm:w-16 md:w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors",
                  selectedIndex === index
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Image
                  src={image}
                  alt={`${title} - Thumbnail ${index + 1}`}
                  fill
                  className="object-cover object-top"
                  sizes="80px"
                  unoptimized={isUpload(image)}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery full screen"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Left / Previous */}
          {galleryImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8 sm:h-10 sm:w-10" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8 sm:h-10 sm:w-10" />
              </button>
            </>
          )}

          {/* Image container - click doesn't close so we can tap image on mobile */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center p-12 sm:p-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[selectedIndex]}
              alt={`${title} - Image ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              unoptimized={isUpload(galleryImages[selectedIndex])}
            />
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/80 text-sm">
            {selectedIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
