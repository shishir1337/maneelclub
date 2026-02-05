import { Skeleton } from "@/components/ui/skeleton";

export function ProductGallerySkeleton() {
  return (
    <div className="space-y-4">
      {/* Main image */}
      <Skeleton className="aspect-square w-full rounded-lg" />
      
      {/* Thumbnails */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-20 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function ProductInfoSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <Skeleton className="h-8 w-3/4" />
      
      {/* Price */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      {/* Color selector */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-8 h-8 rounded-full" />
          ))}
        </div>
      </div>
      
      {/* Size selector */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-12 h-10 rounded-md" />
          ))}
        </div>
      </div>
      
      {/* Quantity */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container py-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <ProductGallerySkeleton />
        <ProductInfoSkeleton />
      </div>
    </div>
  );
}
