import { ProductCard } from "./product-card";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
}

export function ProductGrid({ products, columns = 4 }: ProductGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4 md:gap-6`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          title={product.title}
          slug={product.slug}
          regularPrice={Number(product.regularPrice)}
          salePrice={product.salePrice ? Number(product.salePrice) : null}
          image={product.image || product.images?.[0] || "/productImage.jpeg"}
          category={product.categoryName || product.category?.name}
          hasColorSizeAttributes={
            (product.colors?.length ?? 0) > 0 ||
            (product.sizes?.length ?? 0) > 0 ||
            (product.variants?.length ?? 0) > 0
          }
        />
      ))}
    </div>
  );
}
