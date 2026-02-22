import { Suspense } from "react";
import { ProductGrid } from "./product-grid";
import { ProductGridSkeleton } from "@/components/skeletons";
import { getRelatedProducts } from "@/actions/products";

interface RelatedProductsProps {
  productId: string;
  categoryId?: string | null;
  limit?: number;
}

async function RelatedProductsList({ productId, categoryId, limit = 4 }: RelatedProductsProps) {
  const { data: products } = await getRelatedProducts(productId, categoryId, limit);

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 border-t">
      <div className="container">
        <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
        <ProductGrid products={products} columns={4} />
      </div>
    </section>
  );
}

export function RelatedProducts({ productId, categoryId, limit = 4 }: RelatedProductsProps) {
  return (
    <Suspense fallback={
      <section className="py-12 md:py-16 border-t">
        <div className="container">
          <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
          <ProductGridSkeleton count={limit} />
        </div>
      </section>
    }>
      <RelatedProductsList productId={productId} categoryId={categoryId} limit={limit} />
    </Suspense>
  );
}
