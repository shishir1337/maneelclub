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
    <div className="space-y-3 w-full max-w-full overflow-hidden">
      {/* Main Image - Square on mobile, 3:4 on larger screens */}
      <div className="relative aspect-square md:aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
        <Image
          src={galleryImages[selectedIndex]}
          alt={`${title} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover object-top"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnails - horizontal scroll with hidden scrollbar */}
      {galleryImages.length > 1 && (
        <div className="w-full overflow-hidden">
          <div 
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
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
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
