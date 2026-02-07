"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
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
}

export function ProductCard({
  id,
  title,
  slug,
  regularPrice,
  salePrice,
  image,
  category,
}: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const hasDiscount = salePrice && salePrice < regularPrice;
  const discountPercent = hasDiscount ? calculateDiscount(regularPrice, salePrice) : 0;
  const displayPrice = hasDiscount ? salePrice : regularPrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add with default variant (first available)
    addItem({
      productId: id,
      title,
      slug,
      image,
      price: displayPrice,
      color: "Default",
      size: "M",
      quantity: 1,
    });
    
    toast.success("Added to cart", {
      description: title,
    });
  };

  const handleCardClick = () => {
    router.push(`/product/${slug}`);
  };

  return (
    <Card 
      className="group overflow-hidden border-0 bg-background shadow-none hover:shadow-lg transition-all duration-300 p-0 rounded-xl cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-xl">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover object-top transition-all duration-500 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* Discount Badge */}
        {hasDiscount && discountPercent > 0 && (
          <Badge 
            className="absolute top-2.5 left-2.5 bg-red-700 hover:bg-red-700 text-white font-bold text-xs px-2 py-1 rounded-md shadow-md"
          >
            -{discountPercent}%
          </Badge>
        )}

        {/* Action Button - Right side */}
        <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full shadow-md bg-white/90 hover:bg-white text-foreground backdrop-blur-sm"
            onClick={handleQuickAdd}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="sr-only">Add to cart</span>
          </Button>
        </div>
        
        {/* Quick Add Button - Bottom - Desktop only */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hidden md:block">
          <Button
            size="sm"
            className="w-full gap-2 rounded-lg font-medium shadow-lg"
            onClick={handleQuickAdd}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <CardContent className="p-3 pt-3.5">
        {/* Category tag */}
        {category && (
          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">
            {category}
          </span>
        )}
        
        <h3 className={cn(
          "font-medium text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors duration-200",
          category ? "mt-1" : ""
        )}>
          {title}
        </h3>
        
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-base sm:text-lg text-primary">
            {formatPrice(displayPrice)}
          </span>
          
          {hasDiscount && (
            <span className="text-xs sm:text-sm text-muted-foreground line-through">
              {formatPrice(regularPrice)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
