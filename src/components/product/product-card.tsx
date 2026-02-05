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
}: ProductCardProps) {
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

  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow p-0">
      <Link href={`/product/${slug}`}>
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          
          {/* Discount Badge */}
          {hasDiscount && discountPercent > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 left-2 font-semibold"
            >
              -{discountPercent}%
            </Badge>
          )}
          
          {/* Quick Add Button - Shows on Hover */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="w-full gap-2"
              onClick={handleQuickAdd}
            >
              <ShoppingCart className="h-4 w-4" />
              Quick Add
            </Button>
          </div>
        </div>

        {/* Product Info */}
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-medium text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base sm:text-lg text-primary">
              {formatPrice(displayPrice)}
            </span>
            
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
