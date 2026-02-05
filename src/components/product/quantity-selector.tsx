"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
  disabled = false,
}: QuantitySelectorProps) {
  const decrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const increase = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">Quantity</span>
      
      <div className="flex items-center border rounded-lg w-fit">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-r-none"
          onClick={decrease}
          disabled={disabled || quantity <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <span className="w-12 text-center font-medium">
          {quantity}
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-l-none"
          onClick={increase}
          disabled={disabled || quantity >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
