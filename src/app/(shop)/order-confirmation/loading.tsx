import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderConfirmationLoading() {
  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div>
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
      <Card className="mb-8">
        <CardContent className="p-6">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    </div>
  );
}
