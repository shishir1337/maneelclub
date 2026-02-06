"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/cart-store";
import { useEffect, useState } from "react";
import { useSearchStore } from "@/store/search-store";

const dockItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/cart", label: "Cart", icon: ShoppingCart, showBadge: true },
];

export function MobileDock() {
  const pathname = usePathname();
  const cartCount = useCartStore((state) => state.getTotalItems());
  const [mounted, setMounted] = useState(false);
  const openSearch = useSearchStore((state) => state.open);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Dock background - frosted glass effect */}
      <div className="mx-3 mb-3 rounded-2xl border bg-background/80 backdrop-blur-xl shadow-lg">
        <div className="flex items-center justify-around py-2 px-2">
          {dockItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-xl min-w-0 transition-colors",
                isActive(item.href)
                  ? "text-primary"
                  : "text-muted-foreground active:bg-muted/50"
              )}
            >
              <span className="relative">
                <item.icon
                  className={cn(
                    "h-6 w-6 transition-transform",
                    isActive(item.href) && "scale-110"
                  )}
                  strokeWidth={isActive(item.href) ? 2.5 : 2}
                />
                {item.showBadge && mounted && cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-4 min-w-4 rounded-full p-0 flex items-center justify-center text-[10px]"
                  >
                    {cartCount > 99 ? "99+" : cartCount}
                  </Badge>
                )}
              </span>
              <span className="text-[10px] font-medium truncate w-full text-center">
                {item.label}
              </span>
            </Link>
          ))}
          {/* Search - opens search dialog */}
          <button
            onClick={openSearch}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-xl min-w-0 text-muted-foreground active:bg-muted/50 transition-colors"
            aria-label="Search"
          >
            <Search className="h-6 w-6" strokeWidth={2} />
            <span className="text-[10px] font-medium">Search</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
