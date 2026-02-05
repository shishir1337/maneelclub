"use client";

import { useState, useEffect } from "react";
import { Package, ShoppingCart, Users, DollarSign, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice, formatDate } from "@/lib/format";
import { getOrderStats, getRecentOrders } from "@/actions/admin/orders";
import { getAdminProducts } from "@/actions/admin/products";
import { getCustomerStats } from "@/actions/admin/customers";
import { toast } from "sonner";
import Link from "next/link";

interface Stats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  orderChange: number;
  totalProducts: number;
  totalCustomers: number;
  customerChange: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const [orderStatsResult, recentOrdersResult, productsResult, customerStatsResult] = await Promise.all([
        getOrderStats(),
        getRecentOrders(5),
        getAdminProducts(),
        getCustomerStats(),
      ]);

      if (orderStatsResult.success && orderStatsResult.data) {
        const orderData = orderStatsResult.data;
        const customerData = customerStatsResult.success ? customerStatsResult.data : null;
        const productCount = productsResult.success ? productsResult.data?.length || 0 : 0;

        // Calculate revenue change percentage
        const revenueChange = orderData.lastMonthRevenue > 0
          ? Math.round(((orderData.thisMonthRevenue - orderData.lastMonthRevenue) / orderData.lastMonthRevenue) * 100)
          : 0;

        // Calculate order change percentage
        const orderChange = orderData.lastMonthOrders > 0
          ? Math.round(((orderData.thisMonthOrders - orderData.lastMonthOrders) / orderData.lastMonthOrders) * 100)
          : 0;

        // Calculate customer change percentage
        const customerChange = customerData && customerData.lastMonthCustomers > 0
          ? Math.round(((customerData.thisMonthCustomers - customerData.lastMonthCustomers) / customerData.lastMonthCustomers) * 100)
          : 0;

        setStats({
          totalRevenue: orderData.thisMonthRevenue,
          revenueChange,
          totalOrders: orderData.totalOrders,
          orderChange,
          totalProducts: productCount,
          totalCustomers: customerData?.totalCustomers || 0,
          customerChange,
        });
      }

      if (recentOrdersResult.success && recentOrdersResult.data) {
        setRecentOrders(recentOrdersResult.data as unknown as RecentOrder[]);
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Maneel Club admin dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Month Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats?.revenueChange !== undefined && stats.revenueChange !== 0 && (
                <>
                  {stats.revenueChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={stats.revenueChange > 0 ? "text-green-500" : "text-red-500"}>
                    {stats.revenueChange > 0 ? "+" : ""}{stats.revenueChange}%
                  </span>
                </>
              )}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats?.orderChange !== undefined && stats.orderChange !== 0 && (
                <>
                  {stats.orderChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={stats.orderChange > 0 ? "text-green-500" : "text-red-500"}>
                    {stats.orderChange > 0 ? "+" : ""}{stats.orderChange}%
                  </span>
                </>
              )}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active products in store
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats?.customerChange !== undefined && stats.customerChange !== 0 && (
                <>
                  {stats.customerChange > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={stats.customerChange > 0 ? "text-green-500" : "text-red-500"}>
                    {stats.customerChange > 0 ? "+" : ""}{stats.customerChange}%
                  </span>
                </>
              )}
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link href="/admin/orders" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">No orders yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(new Date(order.createdAt))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
