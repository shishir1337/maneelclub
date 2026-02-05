import { Suspense } from "react";
import Link from "next/link";
import { Package, MapPin, User, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Quick action cards data
const quickActions = [
  {
    title: "My Orders",
    description: "View and track your orders",
    icon: Package,
    href: "/dashboard/orders",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Addresses",
    description: "Manage your shipping addresses",
    icon: MapPin,
    href: "/dashboard/addresses",
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Profile",
    description: "Update your account details",
    icon: User,
    href: "/dashboard/profile",
    color: "bg-purple-500/10 text-purple-500",
  },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}

async function DashboardContent() {
  // In production, fetch user data here
  // const session = await auth.api.getSession({ headers: await headers() });
  
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          Manage your orders, addresses, and account settings.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.href} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-2`}>
                <action.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" size="sm" className="p-0 h-auto" asChild>
                <Link href={action.href} className="flex items-center gap-1 text-primary">
                  View
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Orders Placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Your latest order activity</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/orders">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders yet</p>
            <p className="text-sm">Start shopping to see your orders here</p>
            <Button className="mt-4" asChild>
              <Link href="/shop">Browse Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
