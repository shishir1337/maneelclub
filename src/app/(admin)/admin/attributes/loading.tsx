import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";

export default function AdminAttributesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={4} rows={8} />
        </CardContent>
      </Card>
    </div>
  );
}
