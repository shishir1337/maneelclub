"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

/**
 * Wraps the mobile menu Sheet so it only mounts on the client.
 * This avoids Radix generating different IDs on server vs client (hydration mismatch).
 */
export function AdminMobileMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  // Before mount: render a plain button (same on server and client initial).
  // After mount: render Sheet so Radix IDs are only generated on client.
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild className="lg:hidden">
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
        <div className="py-4">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
