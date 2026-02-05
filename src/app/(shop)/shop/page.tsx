import { Suspense } from "react";
import { Metadata } from "next";
import { siteConfig } from "@/lib/constants";
import { getAllProducts, getCategories, getColorOptionsFromDb } from "@/actions/products";
import { ProductGridSkeleton } from "@/components/skeletons";
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
  
  // Fetch data in parallel (colors from DB = single source of truth)
  const [productsResult, categoriesResult, colorOptions] = await Promise.all([
    getAllProducts(),
    getCategories(),
    getColorOptionsFromDb(),
  ]);

  const allProducts = productsResult.data || [];
  const categories = categoriesResult.data || [];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Shop</h1>
        <p className="text-muted-foreground">
          Browse our complete collection of premium clothing
        </p>
      </div>

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
