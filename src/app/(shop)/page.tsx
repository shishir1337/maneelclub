import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductGrid } from "@/components/product";
import { ProductGridSkeleton } from "@/components/skeletons";
import { siteConfig } from "@/lib/constants";
import { getFeaturedProducts, getNewArrivals } from "@/actions/products";

// Hero slides data - images already contain text/buttons
const heroSlides = [
  {
    id: 1,
    image: "/sliderimagepolo.png",
    alt: "Premium Polo Collection - New Collection at Maneel Club",
    link: "/product-category/polo",
  },
  {
    id: 2,
    image: "/sliderimagesummersale.png",
    alt: "Summer Sale - Up to 50% off on selected items",
    link: "/product-category/sale",
  },
];

// Placeholder for featured categories
const categories = [
  { name: "T-Shirts", slug: "t-shirts", image: "/logo.png" },
  { name: "Hoodies", slug: "hoodie", image: "/logo.png" },
  { name: "Winter Collection", slug: "winter-collection", image: "/logo.png" },
  { name: "New Arrivals", slug: "new-arrivals", image: "/logo.png" },
];

function HeroCarousel() {
  return (
    <section className="w-full">
      <Carousel
        opts={{
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {heroSlides.map((slide) => (
            <CarouselItem key={slide.id}>
              <Link href={slide.link} className="block">
                {/* Simple image display - no overlay since images have their own text */}
                <div className="relative aspect-[2.2/1] sm:aspect-[2.7/1] lg:aspect-[3.2/1] w-full overflow-hidden">
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="left-2 md:left-4" />
        <CarouselNext className="right-2 md:right-4" />
      </Carousel>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
          <Link
            href="/shop"
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            View All
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/product-category/${category.slug}`}
              className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-lg md:text-xl font-semibold">
                  {category.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// Server component to fetch featured products
async function FeaturedProducts() {
  const { data: products } = await getFeaturedProducts(4);
  
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No featured products available.</p>
      </div>
    );
  }
  
  return <ProductGrid products={products} columns={4} />;
}

// Server component to fetch new arrivals
async function NewArrivalsProducts() {
  const { data: products } = await getNewArrivals(4);
  
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No new arrivals available.</p>
      </div>
    );
  }
  
  return <ProductGrid products={products} columns={4} />;
}

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroCarousel />

      {/* Categories Section */}
      <CategoriesSection />

      {/* Featured Products Section */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            <Link
              href="/shop"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">New Arrivals</h2>
            <Link
              href="/product-category/new-arrivals"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <NewArrivalsProducts />
          </Suspense>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Free Shipping on Orders Over BDT 2000
            </h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Get your favorite styles delivered to your doorstep without any extra charges.
              Limited time offer!
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/shop">Shop Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 md:py-16">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Why Choose {siteConfig.name}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Premium Quality</h3>
              <p className="text-muted-foreground text-sm">
                We use only the finest materials to ensure comfort and durability.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Affordable Prices</h3>
              <p className="text-muted-foreground text-sm">
                Get the best value for your money with our competitive pricing.
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-lg">Fast Delivery</h3>
              <p className="text-muted-foreground text-sm">
                Quick and reliable delivery across Bangladesh.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
