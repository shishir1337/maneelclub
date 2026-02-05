"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";

interface MobileStickyBarProps {
  price: number;
  originalPrice?: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function MobileStickyBar({
  price,
  originalPrice,
  onAddToCart,
  onBuyNow,
  disabled = false,
  isLoading = false,
}: MobileStickyBarProps) {
  const hasDiscount = originalPrice && originalPrice > price;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t p-4 md:hidden">
      <div className="flex items-center gap-3">
        {/* Price Display */}
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddToCart}
            disabled={disabled || isLoading}
            className="px-3"
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            onClick={onBuyNow}
            disabled={disabled || isLoading}
            className="px-6"
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}
