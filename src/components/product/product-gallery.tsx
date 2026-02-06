"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Ensure we have at least one image
  const galleryImages = images.length > 0 ? images : ["/logo.png"];

  return (
    <div className="space-y-4">
      {/* Main Image - 3:4 ratio to match product cards */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={galleryImages[selectedIndex]}
          alt={`${title} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover object-top"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails */}
      {galleryImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {galleryImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative aspect-[3/4] w-16 sm:w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors",
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
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
