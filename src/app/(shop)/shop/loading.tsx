import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/skeletons";

export default function ShopLoading() {
  return (
    <div className="container py-8">
      <div className="h-32 animate-pulse bg-muted rounded-lg mb-8" />
      <ProductGridSkeleton count={8} columns={3} />
    </div>
  );
}
