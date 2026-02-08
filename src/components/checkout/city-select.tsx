"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function CitySelect({
  cities,
  value,
  onChange,
  placeholder = "Select area or city...",
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: CitySelectProps) {
  const handleValueChange = (val: string) => {
    const city = cities.find((c) => c.value === val);
    if (city) onChange(city.value, city.shippingZone);
  };

  return (
    <Select
      value={value || undefined}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(
          "w-full h-12 text-base px-4 rounded-lg border-2 min-h-12 font-normal",
          !value && "text-muted-foreground"
        )}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem
            key={city.id}
            value={city.value}
            className="text-base py-3"
          >
            {city.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
