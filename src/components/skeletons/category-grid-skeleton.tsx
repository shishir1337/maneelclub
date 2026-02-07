import { Skeleton } from "@/components/ui/skeleton";

interface CategoryGridSkeletonProps {
  count?: number;
}

export function CategoryGridSkeleton({ count = 4 }: CategoryGridSkeletonProps) {
  return (
    <section className="py-12 md:py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    </section>
  );
}
