"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ProductGallery,
  ColorSelector,
  SizeSelector,
  SizeChartSection,
  QuantitySelector,
  ProductTabs,
  AddToCartButton,
} from "@/components/product";
import { formatPrice, calculateDiscount } from "@/lib/format";

interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  size: string;
  stock: number;
  sku: string | null;
  price?: number | string | null;
  images?: string[];
}

interface SizeChart {
  headers: string[];
  rows: { size: string; measurements: string[] }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  regularPrice: number;
  salePrice: number | null;
  images: string[];
  colors: string[];
  sizes: string[];
  stock: number;
  trackInventory?: boolean;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string | null;
  category?: Category | null;
  categorySlug?: string;
  categoryName?: string;
  variants?: ProductVariant[];
  colorHexMap?: Record<string, string>;
  sizeChart: SizeChart | null;
}

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  
  // Get colors and sizes from product (or fallback to variants if available)
  const availableColors = useMemo(() => {
    if (product.colors && product.colors.length > 0) {
      return product.colors;
    }
    if (product.variants && product.variants.length > 0) {
      return [...new Set(product.variants.map((v) => v.color))];
    }
    return ["Default"];
  }, [product.colors, product.variants]);
  
  const availableSizes = useMemo(() => {
    let sizes: string[];
    if (product.sizes && product.sizes.length > 0) {
      sizes = product.sizes;
    } else if (product.variants && product.variants.length > 0) {
      sizes = [...new Set(product.variants.map((v) => v.size))];
    } else {
      sizes = ["M", "L", "XL", "XXL"];
    }
    // Sort sizes in order: S, M, L, XL, XXL
    const sizeOrder = ["S", "M", "L", "XL", "XXL", "3XL"];
    return sizes.sort((a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b));
  }, [product.sizes, product.variants]);
  
  // State - no default selection; user must choose to avoid wrong variant orders
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  
  // Check if inventory tracking is enabled
  const trackInventory = product.trackInventory ?? false;
  
  // Get available sizes for selected color (if using variants)
  const sizesForColor = useMemo(() => {
    // If not tracking inventory, all sizes are available
    if (!trackInventory) {
      return availableSizes;
    }
    
    if (product.variants && product.variants.length > 0) {
      return product.variants
        .filter((v) => v.color === selectedColor && v.stock > 0)
        .map((v) => v.size);
    }
    // If no variants, all sizes are available based on product stock
    return product.stock > 0 ? availableSizes : [];
  }, [product.variants, product.stock, selectedColor, availableSizes, trackInventory]);
  
  // Get out of stock sizes for selected color
  const outOfStockSizes = useMemo(() => {
    // If not tracking inventory, nothing is out of stock
    if (!trackInventory) {
      return [];
    }
    
    if (product.variants && product.variants.length > 0) {
      return availableSizes.filter((size) => !sizesForColor.includes(size));
    }
    // If no variants, sizes are available if product has stock
    return product.stock > 0 ? [] : availableSizes;
  }, [availableSizes, sizesForColor, product.variants, product.stock, trackInventory]);
  
  // Get current variant stock (or product stock if no variants)
  const currentVariant = useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.find(
        (v) => v.color === selectedColor && v.size === selectedSize
      );
    }
    return null;
  }, [product.variants, selectedColor, selectedSize]);
  
  // Variable products: require color+size selected; simple products: always in stock
  const hasValidSelection = !trackInventory || (selectedColor && selectedSize && currentVariant);
  const currentStock = trackInventory 
    ? (currentVariant?.stock ?? 0)
    : 999;
  const isInStock = hasValidSelection && (!trackInventory || currentStock > 0);

  // Gallery: always show ALL images. When color selected, put that color's images first (reorder, never hide).
  const displayImages = useMemo(() => {
    const productImgs = product.images?.length ? product.images : ["/productImage.jpeg"];
    const seen = new Set<string>();
    const allImages: string[] = [];

    for (const url of productImgs) {
      if (!seen.has(url)) {
        seen.add(url);
        allImages.push(url);
      }
    }
    for (const v of product.variants ?? []) {
      for (const url of v.images ?? []) {
        if (!seen.has(url)) {
          seen.add(url);
          allImages.push(url);
        }
      }
    }

    if (allImages.length === 0) return ["/productImage.jpeg"];

    // When color selected: put color-specific images first, rest after
    if (selectedColor) {
      const variantWithImages = product.variants?.find(
        (v) => v.color === selectedColor && v.images?.length
      );
      if (variantWithImages?.images?.length) {
        const colorUrls = variantWithImages.images;
        const rest = allImages.filter((url) => !colorUrls.includes(url));
        return [...colorUrls, ...rest];
      }
    }

    return allImages;
  }, [product.images, product.variants, selectedColor]);
  
  // Pricing: use variant sale price when set, else product-level prices
  const regularPrice = Number(product.regularPrice);
  const productSalePrice = product.salePrice ? Number(product.salePrice) : null;
  const variantSalePrice = currentVariant?.price != null ? Number(currentVariant.price) : null;
  const salePrice = variantSalePrice ?? productSalePrice;
  const hasDiscount = salePrice != null && salePrice < regularPrice;
  const displayPrice = hasDiscount ? salePrice : regularPrice;
  const discountPercent = hasDiscount ? calculateDiscount(regularPrice, salePrice) : 0;
  
  // Handle color change - reset size if not available
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    
    // If not tracking inventory, all sizes are always available
    if (!trackInventory) {
      return;
    }
    
    // Check variants for available sizes
    const sizesForNewColor = product.variants
      ? product.variants
          .filter((v) => v.color === color && v.stock > 0)
          .map((v) => v.size)
      : availableSizes;
    
    if (!sizesForNewColor.includes(selectedSize)) {
      setSelectedSize("");
    }
  };

  return (
    <>
      <div className="container py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          {product.category && (
            <>
              <Link 
                href={`/product-category/${product.category.slug}`}
                className="hover:text-primary"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="h-4 w-4" />
            </>
          )}
          <span className="text-foreground truncate max-w-[200px]">
            {product.title}
          </span>
        </nav>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <ProductGallery images={displayImages} title={product.title} />

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{product.title}</h1>
              {product.category && (
                <Link 
                  href={`/product-category/${product.category.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {product.category.name}
                </Link>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl md:text-3xl font-bold text-primary">
                {formatPrice(displayPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(regularPrice)}
                  </span>
                  <Badge variant="destructive" className="text-sm">
                    -{discountPercent}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {!hasValidSelection && trackInventory ? (
                <span className="text-sm text-muted-foreground">
                  Please select color and size
                </span>
              ) : isInStock ? (
                <span className="text-sm text-green-600 font-medium">
                  {trackInventory 
                    ? `✓ In Stock (${currentStock} available)` 
                    : "✓ In Stock"}
                </span>
              ) : (
                <span className="text-sm text-destructive font-medium">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Color Selector */}
            {availableColors.length > 0 && (
              <div>
                <ColorSelector
                  colors={availableColors}
                  selectedColor={selectedColor}
                  onSelect={handleColorChange}
                  colorHexMap={product.colorHexMap}
                />
                {trackInventory && !selectedColor && (
                  <p className="text-sm text-destructive mt-1">Please select a color</p>
                )}
              </div>
            )}

            {/* Size Selector */}
            {availableSizes.length > 0 && (
              <div>
                <SizeSelector
                  sizes={availableSizes}
                  selectedSize={selectedSize}
                  onSelect={setSelectedSize}
                  outOfStockSizes={outOfStockSizes}
                />
                {trackInventory && selectedColor && !selectedSize && (
                  <p className="text-sm text-destructive mt-1">Please select a size</p>
                )}
              </div>
            )}

            {/* Quantity */}
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={setQuantity}
              max={currentStock || 10}
            />

            {/* Size Guide - expandable section */}
            <SizeChartSection sizeChart={product.sizeChart} />

            {/* Action Buttons - Desktop & Mobile */}
            <div className="flex flex-col gap-3 pt-4">
              <AddToCartButton
                productId={product.id}
                title={product.title}
                slug={product.slug}
                image={displayImages[0] || "/logo.png"}
                price={displayPrice}
                color={selectedColor}
                size={selectedSize}
                quantity={quantity}
                disabled={!isInStock}
                className="w-full"
              />
              <AddToCartButton
                productId={product.id}
                title={product.title}
                slug={product.slug}
                image={displayImages[0] || "/logo.png"}
                price={displayPrice}
                color={selectedColor}
                size={selectedSize}
                quantity={quantity}
                variant="buy-now"
                disabled={!isInStock}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-12">
          <ProductTabs 
            description={product.description} 
            sizeChart={product.sizeChart} 
          />
        </div>
      </div>

    </>
  );
}
