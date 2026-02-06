import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 bg-background shadow-none rounded-xl p-0">
      {/* Image skeleton */}
      <Skeleton className="aspect-[3/4] w-full rounded-xl" />
      
      <CardContent className="p-3 pt-3.5 space-y-2">
        {/* Category skeleton */}
        <Skeleton className="h-3 w-16" />
        
        {/* Title skeleton */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        
        {/* Price skeleton */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
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
