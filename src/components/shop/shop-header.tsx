"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

interface ShopHeaderProps {
  categories: Category[];
  searchParams: { search?: string; category?: string };
}

export function ShopHeader({ categories, searchParams }: ShopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();

  const searchQuery = searchParams.search ?? "";
  const selectedCategorySlug = searchParams.category ?? "";

  const parentCategories = categories.filter((c) => !c.parentId);
  const selectedParent =
    parentCategories.find((p) => p.slug === selectedCategorySlug) ??
    parentCategories.find((p) => p.children?.some((c) => c.slug === selectedCategorySlug));
  const subcategories = selectedParent?.children ?? [];

  const updateParams = (updates: { search?: string; category?: string }) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search);
      else params.delete("search");
    }
    if (updates.category !== undefined) {
      if (updates.category) params.set("category", updates.category);
      else params.delete("category");
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.querySelector<HTMLInputElement>('input[name="search"]');
    const value = input?.value?.trim() ?? "";
    updateParams({ search: value || undefined });
  };

  const handleParentClick = (slug: string | null) => {
    updateParams({ category: slug ?? undefined });
  };

  const handleSubcategoryClick = (slug: string) => {
    updateParams({ category: slug });
  };

  const isParentSelected = (slug: string) => slug === selectedCategorySlug;
  const isSubcategorySelected = (slug: string) => slug === selectedCategorySlug;

  const badgeClass = (selected: boolean) =>
    cn(
      "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
      selected
        ? "bg-primary text-primary-foreground"
        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-4 mb-8">
      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          name="search"
          type="search"
          placeholder="Search products..."
          defaultValue={searchQuery}
          className="pl-12 pr-4 h-12 text-base rounded-xl"
        />
        <Button type="submit" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
          Search
        </Button>
      </form>

      {/* Category badges */}
      <div className="space-y-3">
        {/* Row 1: All + parent categories */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleParentClick(null)}
            className={badgeClass(!selectedCategorySlug)}
          >
            All
          </button>
          {parentCategories.map((parent) => (
            <button
              key={parent.id}
              type="button"
              onClick={() => handleParentClick(parent.slug)}
              className={badgeClass(isParentSelected(parent.slug))}
            >
              {parent.name}
            </button>
          ))}
        </div>

        {/* Row 2: All + subcategories (when a parent is selected) — "All" repeated for mobile so it's visible without scrolling */}
        {subcategories.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-2">
            <button
              type="button"
              onClick={() => handleParentClick(null)}
              className={badgeClass(!selectedCategorySlug)}
            >
              All
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => handleSubcategoryClick(sub.slug)}
                className={badgeClass(isSubcategorySelected(sub.slug))}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
