import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full" />
      
      <CardContent className="p-4 space-y-3">
        {/* Title skeleton */}
        <Skeleton className="h-4 w-3/4" />
        
        {/* Price skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        {/* Button skeleton */}
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );
}

interface ProductGridSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
}

export function ProductGridSkeleton({ count = 4, columns = 4 }: ProductGridSkeletonProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };
  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
