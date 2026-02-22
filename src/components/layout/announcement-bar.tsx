"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export interface AnnouncementBarProps {
  enabled: boolean;
  message: string;
  link: string;
  linkText: string;
  countdownEnabled?: boolean;
  countdownEnd?: string;
  countdownLabel?: string;
}

function getTimeLeft(ms: number): { d: number; h: number; m: number; s: number } | null {
  if (ms <= 0) return null;
  return {
    d: Math.floor(ms / (1000 * 60 * 60 * 24)),
    h: Math.floor((ms / (1000 * 60 * 60)) % 24),
    m: Math.floor((ms / (1000 * 60)) % 60),
    s: Math.floor((ms / 1000) % 60),
  };
}

export function AnnouncementBar({
  enabled,
  message,
  link,
  linkText,
  countdownEnabled = false,
  countdownEnd = "",
  countdownLabel = "Offer ends in",
}: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const endMs = countdownEnabled && countdownEnd?.trim() ? new Date(countdownEnd).getTime() : 0;
  const remaining = endMs > 0 ? endMs - now : 0;
  const countdownEnded = countdownEnabled && endMs > 0 && remaining <= 0;
  const timeLeft = countdownEnabled && endMs > 0 && remaining > 0 ? getTimeLeft(remaining) : null;

  useEffect(() => {
    if (!countdownEnabled || !countdownEnd?.trim() || endMs <= 0) return;
    if (Date.now() >= endMs) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [countdownEnabled, countdownEnd, endMs]);

  if (!enabled || !isVisible || !message.trim() || countdownEnded) {
    return null;
  }

  return (
    <div className="border-b border-primary/20 bg-primary text-primary-foreground text-sm relative">
      <div className="container flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-2 py-2.5 sm:py-2.5 pl-4 pr-12 sm:pr-10 min-h-[2.75rem] sm:min-h-0">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center sm:text-left order-1 sm:order-none">
          <span>{message}</span>
          {link?.trim() && (
            <Link
              href={link}
              className="font-medium underline underline-offset-2 hover:opacity-90 transition-opacity"
            >
              {linkText?.trim() || "Learn more"}
            </Link>
          )}
        </div>
        {countdownEnabled && timeLeft && (
          <span className="inline-flex items-center justify-center gap-1.5 sm:gap-1.5 shrink-0 order-2 sm:order-none">
            {countdownLabel?.trim() && (
              <span className="text-primary-foreground/90 text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                {countdownLabel.trim()}
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 sm:gap-1">
              {[
                { value: timeLeft.d, label: "D" },
                { value: timeLeft.h, label: "H" },
                { value: timeLeft.m, label: "M" },
                { value: timeLeft.s, label: "S" },
              ].map(({ value, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center justify-center gap-0.5 sm:gap-1 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded bg-primary-foreground/15 border border-primary-foreground/20 min-w-[2.25rem] sm:min-w-0"
                >
                  <span className="text-sm sm:text-base font-bold tabular-nums leading-none">
                    {String(value).padStart(2, "0")}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-wider text-primary-foreground/70">
                    {label}
                  </span>
                </span>
              ))}
            </span>
          </span>
        )}
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors touch-manipulation"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
