"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { ANNOUNCEMENT } from "@/lib/constants";

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!ANNOUNCEMENT.enabled || !isVisible) {
    return null;
  }

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm relative">
      <div className="container flex items-center justify-center gap-2">
        <span>{ANNOUNCEMENT.message}</span>
        {ANNOUNCEMENT.link && (
          <Link
            href={ANNOUNCEMENT.link}
            className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity"
          >
            {ANNOUNCEMENT.linkText}
          </Link>
        )}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
