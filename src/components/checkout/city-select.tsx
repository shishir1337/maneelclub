"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CityWithZone } from "@/actions/cities";

interface CitySelectProps {
  cities: CityWithZone[];
  value: string;
  onChange: (value: string, shippingZone: "inside_dhaka" | "outside_dhaka") => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

/**
 * Native <select> so mobile browsers use OS picker:
 * - iOS: native wheel picker
 * - Android: native dropdown/bottom sheet
 */
export function CitySelect({
  cities,
  value,
  onChange,
  placeholder = "Select area or city...",
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: CitySelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const city = cities.find((c) => c.value === val);
    if (city) onChange(city.value, city.shippingZone);
  };

  return (
    <div className="relative w-full">
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "w-full h-12 text-base px-4 pr-10 rounded-lg border-2 min-h-12 font-normal",
          "bg-background border-input",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "appearance-none cursor-pointer",
          !value && "text-muted-foreground"
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {cities.map((city) => (
          <option key={city.id} value={city.value}>
            {city.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 shrink-0 opacity-50 pointer-events-none"
        aria-hidden
      />
    </div>
  );
}
