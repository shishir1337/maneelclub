import { Suspense } from "react";
import { ProductGrid } from "./product-grid";
import { ProductGridSkeleton } from "@/components/skeletons";
import { getRelatedProducts } from "@/actions/products";

interface RelatedProductsProps {
  categoryId: string;
  excludeProductId: string;
}

async function RelatedProductsList({ categoryId, excludeProductId }: RelatedProductsProps) {
  const { data: products } = await getRelatedProducts(categoryId, excludeProductId, 4);
  
  if (!products || products.length === 0) {
    return null;
  }
  
  return <ProductGrid products={products} columns={4} />;
}

export function RelatedProducts({ categoryId, excludeProductId }: RelatedProductsProps) {
  return (
    <section className="py-12 md:py-16 border-t">
      <div className="container">
        <h2 className="text-2xl font-bold mb-8">You May Also Like</h2>
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <RelatedProductsList 
            categoryId={categoryId} 
            excludeProductId={excludeProductId} 
          />
        </Suspense>
      </div>
    </section>
  );
}
