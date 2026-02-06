import { Suspense } from "react";
import { Metadata } from "next";
import { siteConfig } from "@/lib/constants";
import { getAllProducts, getCategories, getColorOptionsFromDb } from "@/actions/products";
import { ProductGridSkeleton } from "@/components/skeletons";
import { ShopHeader } from "@/components/shop/shop-header";
import { ShopContent } from "./shop-content";

export const metadata: Metadata = {
  title: `Shop | ${siteConfig.name}`,
  description: `Browse all products at ${siteConfig.name}. Premium clothing at affordable prices.`,
};

interface ShopPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    color?: string;
    size?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const [productsResult, categoriesResult, colorOptions] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getColorOptionsFromDb(),
  ]);

  const allProducts = productsResult.data || [];
  const categories = categoriesResult.data || [];

  return (
    <div className="container py-8">
      <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded-lg mb-8" />}>
        <ShopHeader categories={categories} searchParams={params} />
      </Suspense>

      <Suspense fallback={<ProductGridSkeleton count={8} columns={3} />}>
        <ShopContent
          products={allProducts}
          categories={categories}
          colorOptions={colorOptions}
          searchParams={params}
        />
      </Suspense>
    </div>
  );
}
