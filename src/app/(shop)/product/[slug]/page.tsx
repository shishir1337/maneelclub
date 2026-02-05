import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getProductBySlug } from "@/actions/products";
import { siteConfig } from "@/lib/constants";
import { ProductDetails } from "./product-details";
import { RelatedProducts } from "@/components/product";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: product } = await getProductBySlug(slug);
  
  if (!product) {
    return {
      title: "Product Not Found",
    };
  }
  
  return {
    title: product.title,
    description: product.description || `Buy ${product.title} at ${siteConfig.name}`,
    openGraph: {
      title: product.title,
      description: product.description || `Buy ${product.title} at ${siteConfig.name}`,
      images: product.images[0] ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { data: product, error } = await getProductBySlug(slug);
  
  if (error || !product) {
    notFound();
  }
  
  return (
    <>
      <ProductDetails
        product={{
          ...product,
          regularPrice: Number(product.regularPrice),
          salePrice: product.salePrice != null ? Number(product.salePrice) : null,
          category: product.category ?? null,
        }}
      />
      
      {product.categoryId && (
        <RelatedProducts 
          categoryId={product.categoryId} 
          excludeProductId={product.id} 
        />
      )}
    </>
  );
}
