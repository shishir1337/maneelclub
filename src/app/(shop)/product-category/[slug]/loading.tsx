import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/skeletons";

export default function CategoryLoading() {
  return (
    <div className="container py-8">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-24" />
      </nav>
      <div className="space-y-2 mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <ProductGridSkeleton count={8} columns={4} />
    </div>
  );
}
