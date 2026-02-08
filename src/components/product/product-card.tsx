"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, calculateDiscount } from "@/lib/format";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  regularPrice: number;
  salePrice?: number | null;
  image: string;
  category?: string;
  /** When false, product has no color/size options; quick-add uses "—" for cart display */
  hasColorSizeAttributes?: boolean;
}

export function ProductCard({
  id,
  title,
  slug,
  regularPrice,
  salePrice,
  image,
  category,
  hasColorSizeAttributes = true,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const hasDiscount = salePrice && salePrice < regularPrice;
  const discountPercent = hasDiscount ? calculateDiscount(regularPrice, salePrice) : 0;
  const savings = hasDiscount ? regularPrice - salePrice : 0;
  const displayPrice = hasDiscount ? salePrice : regularPrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: id,
      title,
      slug,
      image,
      price: displayPrice,
      color: hasColorSizeAttributes ? "Default" : "—",
      size: hasColorSizeAttributes ? "M" : "—",
      quantity: 1,
    });
    
    toast.success("Added to cart", {
      description: title,
    });
  };

  return (
    <Card 
      className="group overflow-hidden border border-border/50 bg-background shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 p-0 rounded-xl"
    >
      {/* Image Container - Link for proper semantics & right-click */}
      <Link href={`/product/${slug}`} className="block relative aspect-[3/4] overflow-hidden bg-muted rounded-t-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 315px"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* Discount Badge - Top left */}
        {hasDiscount && discountPercent > 0 && (
          <Badge
            className="absolute top-2.5 left-2.5 border-0 bg-red-700 px-2 py-1 text-xs font-bold text-white shadow-md hover:bg-red-700 dark:bg-red-800 dark:text-white dark:hover:bg-red-800"
            aria-label={`${discountPercent}% off`}
          >
            -{discountPercent}%
          </Badge>
        )}

        {/* Quick Add - Always visible on mobile, hover on desktop */}
        <div className="absolute top-2 right-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-x-2 md:group-hover:translate-x-0">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full shadow-lg bg-white/95 hover:bg-white text-foreground backdrop-blur-sm border border-border/50"
            onClick={handleQuickAdd}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Add to cart</span>
          </Button>
        </div>
        
        {/* Full-width Add to Cart - Bottom, visible on hover (desktop) / always (mobile) */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 md:translate-y-full md:group-hover:translate-y-0">
          <Button
            size="sm"
            className="w-full gap-2 rounded-lg font-medium shadow-lg md:shadow-xl"
            onClick={handleQuickAdd}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            Add to Cart
          </Button>
        </div>
      </Link>

      {/* Product Info - Clickable link wrapper */}
      <Link href={`/product/${slug}`}>
        <CardContent className="p-3.5 pt-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-b-xl">
          {/* Category tag */}
          {category && (
            <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {category}
            </span>
          )}
          
          <h3 className={cn(
            "font-medium text-sm sm:text-base line-clamp-2 mt-1 group-hover:text-primary transition-colors duration-200",
            !category && "mt-0"
          )}>
            {title}
          </h3>

          {/* Price row with Save badge */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="font-bold text-base sm:text-lg text-primary">
              {formatPrice(displayPrice)}
            </span>
            
            {hasDiscount && (
              <span className="text-xs sm:text-sm text-muted-foreground line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
            
            {hasDiscount && savings > 0 && (
              <Badge
                className="rounded-md border-0 bg-green-700 px-2 py-0.5 text-xs font-semibold text-white hover:bg-green-700 dark:bg-green-800 dark:text-white dark:hover:bg-green-800"
                aria-label={`Save ${savings.toLocaleString("en-BD")} taka`}
              >
                Save {savings.toLocaleString("en-BD")}tk
              </Badge>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
