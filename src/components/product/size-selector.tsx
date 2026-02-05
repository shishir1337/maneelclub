"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string;
  onSelect: (size: string) => void;
  disabled?: boolean;
  outOfStockSizes?: string[];
}

export function SizeSelector({
  sizes,
  selectedSize,
  onSelect,
  disabled = false,
  outOfStockSizes = [],
}: SizeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Size</span>
        <span className="text-sm text-muted-foreground">{selectedSize}</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = size === selectedSize;
          const isOutOfStock = outOfStockSizes.includes(size);
          
          return (
            <Button
              key={size}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(size)}
              disabled={disabled || isOutOfStock}
              className={cn(
                "min-w-[48px]",
                isOutOfStock && "line-through opacity-50"
              )}
            >
              {size}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
