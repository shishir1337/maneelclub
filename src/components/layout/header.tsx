"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/constants";
import { useCartStore } from "@/store/cart-store";
import { useSession, signOut } from "@/lib/auth-client";
import { SearchDialog } from "./search-dialog";
import { useSearchStore } from "@/store/search-store";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  { name: "New Arrivals", href: "/product-category/new-arrivals" },
  { name: "Winter Collection", href: "/product-category/winter-collection" },
  { name: "Hoodie", href: "/product-category/hoodie" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchOpen = useSearchStore((s) => s.isOpen);
  const setSearchOpen = useSearchStore((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const cartItemsCount = useCartStore((state) => state.getTotalItems());
  const { data: session } = useSession();
  
  // Only show cart count after hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  const user = session?.user;
  
  // Check if link is active
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile: Left - Hamburger | Center - Logo | Right - Search + Cart */}
          {/* Desktop: Left - Logo | Center - Nav | Right - Search + User + Cart */}
          
          {/* Mobile layout: [Hamburger] [Logo centered] [Search + Cart] */}
          <div className="relative flex md:hidden flex-1 items-center min-w-0">
            {/* Left: Hamburger */}
            <div className="flex-shrink-0 z-10">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(85vw,320px)] sm:w-[340px] p-0">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <nav className="flex flex-col h-full">
                    {/* Menu header with padding */}
                    <div className="px-5 pt-6 pb-4 border-b">
                      <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto py-4 px-5">
                      <div className="flex flex-col gap-1">
                        {navigation.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              "py-3 px-3 -mx-3 rounded-lg text-base font-medium transition-colors",
                              isActive(item.href) 
                                ? "bg-primary/10 text-primary" 
                                : "text-foreground hover:bg-muted"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                      <div className="border-t my-4 pt-4 mt-6">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 mb-2">Account</p>
                        {user ? (
                          <div className="flex flex-col gap-1">
                            <Link
                              href="/dashboard"
                              className="py-3 px-3 -mx-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              My Account
                            </Link>
                            {(user as { role?: string }).role === "ADMIN" && (
                              <Link
                                href="/admin"
                                className="py-3 px-3 -mx-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                Admin Dashboard
                              </Link>
                            )}
                            <button
                              onClick={() => {
                                signOut();
                                setMobileMenuOpen(false);
                              }}
                              className="py-3 px-3 -mx-3 rounded-lg text-base font-medium text-destructive hover:bg-destructive/10 text-left transition-colors"
                            >
                              Sign Out
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <Link
                              href="/sign-in"
                              className="py-3 px-3 -mx-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Sign In
                            </Link>
                            <Link
                              href="/sign-up"
                              className="py-3 px-3 -mx-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              Sign Up
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>

            {/* Center: Logo - absolutely centered in container */}
            <Link
              href="/"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
            >
              <Image
                src="/logo.png"
                alt={siteConfig.name}
                width={36}
                height={36}
                className="h-9 w-auto"
              />
            </Link>

            {/* Right: Search + Cart */}
            <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto z-10">
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && cartItemsCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {cartItemsCount > 99 ? "99+" : cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex flex-1 items-center min-w-0">
            <div className="flex items-center gap-2 w-[200px] flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt={siteConfig.name}
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="font-bold text-xl">{siteConfig.name}</span>
              </Link>
            </div>
            <nav className="flex flex-1 items-center justify-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive(item.href) 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-1 w-[200px] justify-end flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Account">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user ? (
                    <>
                      <div className="px-2 py-1.5 text-sm font-medium">
                        {user.name || user.email}
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">My Account</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/orders">My Orders</Link>
                      </DropdownMenuItem>
                      {(user as { role?: string }).role === "ADMIN" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href="/admin">Admin Dashboard</Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="text-destructive"
                      >
                        Sign Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/sign-in">Sign In</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/sign-up">Sign Up</Link>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
                  <ShoppingBag className="h-5 w-5" />
                  {mounted && cartItemsCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {cartItemsCount > 99 ? "99+" : cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* SearchDialog - shared by header buttons and dock */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
