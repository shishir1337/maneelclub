"use client";

import { cn } from "@/lib/utils";
import { PRODUCT_COLORS } from "@/lib/constants";

interface ColorSelectorProps {
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
  disabled?: boolean;
  /** Optional map of color name -> hex from product attributes (overrides constants) */
  colorHexMap?: Record<string, string>;
}

export function ColorSelector({
  colors,
  selectedColor,
  onSelect,
  disabled = false,
  colorHexMap,
}: ColorSelectorProps) {
  const getColorHex = (colorName: string): string => {
    if (colorHexMap?.[colorName]) return colorHexMap[colorName];
    const found = PRODUCT_COLORS.find(
      (c) => c.label.toLowerCase() === colorName.toLowerCase() ||
             c.value.toLowerCase() === colorName.toLowerCase()
    );
    return found?.hex || "#888888";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Color</span>
        <span className="text-sm text-muted-foreground">{selectedColor}</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => {
          const hex = getColorHex(color);
          const isSelected = color === selectedColor;
          const isLight = hex.toLowerCase() === "#ffffff" || hex.toLowerCase() === "#faf9f6";
          
          return (
            <button
              key={color}
              onClick={() => onSelect(color)}
              disabled={disabled}
              title={color}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all relative",
                isSelected
                  ? "ring-2 ring-primary ring-offset-2"
                  : "hover:scale-110",
                isLight && "border-gray-300",
                !isLight && "border-transparent",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{ backgroundColor: hex }}
            >
              {isSelected && (
                <span 
                  className={cn(
                    "absolute inset-0 flex items-center justify-center text-xs",
                    isLight ? "text-gray-800" : "text-white"
                  )}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
