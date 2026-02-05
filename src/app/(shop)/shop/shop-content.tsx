"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductGrid } from "@/components/product";
import { PRODUCT_COLORS, PRODUCT_SIZES } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { Product, Category } from "@/types";

interface ColorOption {
  value: string;
  label: string;
  hex: string;
}

interface ShopContentProps {
  products: Product[];
  categories: Category[];
  /** Colors from DB (single source of truth); fallback to PRODUCT_COLORS if empty */
  colorOptions?: ColorOption[];
  searchParams: {
    search?: string;
    category?: string;
    color?: string;
    size?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

const sortOptions = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A to Z" },
];

export function ShopContent({ products, categories, colorOptions = [], searchParams }: ShopContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();

  // Use DB colors when available, else fallback to constants
  const colorList: ColorOption[] = colorOptions.length > 0
    ? colorOptions
    : PRODUCT_COLORS.map((c) => ({ value: c.value, label: c.label, hex: c.hex }));

  // Local filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.category ? searchParams.category.split(",") : []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>(
    searchParams.color ? searchParams.color.split(",") : []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    searchParams.size ? searchParams.size.split(",") : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([
    searchParams.minPrice ? parseInt(searchParams.minPrice) : 0,
    searchParams.maxPrice ? parseInt(searchParams.maxPrice) : 5000,
  ]);
  const [sortBy, setSortBy] = useState(searchParams.sort || "default");
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  
  // Get price range from products
  const maxProductPrice = useMemo(() => {
    return Math.max(...products.map((p) => Number(p.salePrice || p.regularPrice)), 5000);
  }, [products]);
  
  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Filter by category
    if (selectedCategories.length > 0) {
      result = result.filter((p) => 
        selectedCategories.includes(p.categorySlug || "")
      );
    }
    
    // Filter by color (match product color to colorList by label or value)
    if (selectedColors.length > 0) {
      result = result.filter((p) => {
        const matchProductColor = (productColor: string) => {
          const opt = colorList.find(
            (c) => c.label.toLowerCase() === productColor.toLowerCase() ||
                   c.value === productColor.toLowerCase().replace(/\s+/g, "-")
          );
          return opt && selectedColors.includes(opt.value);
        };
        if (p.colors && p.colors.length > 0) {
          return p.colors.some(matchProductColor);
        }
        return p.variants?.some((v) => matchProductColor(v.color)) ?? false;
      });
    }
    
    // Filter by size
    if (selectedSizes.length > 0) {
      result = result.filter((p) => {
        // Check product sizes array first
        if (p.sizes && p.sizes.length > 0) {
          return p.sizes.some((s) => selectedSizes.includes(s));
        }
        // Fallback to variants
        return p.variants?.some((v) => 
          selectedSizes.includes(v.size) && v.stock > 0
        );
      });
    }
    
    // Filter by price
    result = result.filter((p) => {
      const price = Number(p.salePrice || p.regularPrice);
      return price >= priceRange[0] && price <= priceRange[1];
    });
    
    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => Number(a.salePrice || a.regularPrice) - Number(b.salePrice || b.regularPrice));
        break;
      case "price-desc":
        result.sort((a, b) => Number(b.salePrice || b.regularPrice) - Number(a.salePrice || a.regularPrice));
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "name-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    return result;
  }, [products, searchQuery, selectedCategories, selectedColors, selectedSizes, priceRange, sortBy]);
  
  // Update URL with filters
  const updateURL = () => {
    const params = new URLSearchParams();
    
    if (selectedCategories.length > 0) {
      params.set("category", selectedCategories.join(","));
    }
    if (selectedColors.length > 0) {
      params.set("color", selectedColors.join(","));
    }
    if (selectedSizes.length > 0) {
      params.set("size", selectedSizes.join(","));
    }
    if (priceRange[0] > 0) {
      params.set("minPrice", priceRange[0].toString());
    }
    if (priceRange[1] < maxProductPrice) {
      params.set("maxPrice", priceRange[1].toString());
    }
    if (sortBy !== "default") {
      params.set("sort", sortBy);
    }
    
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  };
  
  // Toggle filter handlers
  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };
  
  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };
  
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, maxProductPrice]);
    setSortBy("default");
    router.push(pathname, { scroll: false });
  };
  
  // Count active filters
  const activeFilterCount = 
    selectedCategories.length + 
    selectedColors.length + 
    selectedSizes.length + 
    (priceRange[0] > 0 || priceRange[1] < maxProductPrice ? 1 : 0);
  
  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Active Filters</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <Badge key={cat} variant="secondary" className="gap-1">
                {categories.find((c) => c.slug === cat)?.name || cat}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleCategory(cat)} />
              </Badge>
            ))}
            {selectedColors.map((color) => (
              <Badge key={color} variant="secondary" className="gap-1">
                {colorList.find((c) => c.value === color)?.label || color}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleColor(color)} />
              </Badge>
            ))}
            {selectedSizes.map((size) => (
              <Badge key={size} variant="secondary" className="gap-1">
                {size}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSize(size)} />
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      <Accordion type="multiple" defaultValue={["categories", "colors", "sizes", "price"]} className="w-full">
        {/* Categories */}
        <AccordionItem value="categories">
          <AccordionTrigger className="text-sm font-medium">Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`cat-${category.slug}`}
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={() => toggleCategory(category.slug)}
                  />
                  <Label
                    htmlFor={`cat-${category.slug}`}
                    className="text-sm font-normal cursor-pointer flex-1"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Colors */}
        <AccordionItem value="colors">
          <AccordionTrigger className="text-sm font-medium">Colors</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-5 gap-2">
              {colorList.map((color) => (
                <button
                  key={color.value}
                  onClick={() => toggleColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColors.includes(color.value)
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-muted hover:border-muted-foreground"
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.label}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Sizes */}
        <AccordionItem value="sizes">
          <AccordionTrigger className="text-sm font-medium">Sizes</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_SIZES.map((size) => (
                <Button
                  key={size}
                  variant={selectedSizes.includes(size) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSize(size)}
                  className="min-w-[48px]"
                >
                  {size}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-medium">Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="px-1">
              <Slider
                value={priceRange}
                onValueChange={(value) => setPriceRange(value as [number, number])}
                max={maxProductPrice}
                step={50}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <Button onClick={updateURL} className="w-full">
        Apply Filters
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-24">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h2>
          <FilterContent />
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
          </p>
          
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value) => { setSortBy(value); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <ProductGrid products={filteredProducts} columns={3} />
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No products match your filters.</p>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
