"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatPrice } from "@/lib/format";
import {
  getAnalyticsOverview,
  getRevenueByPeriod,
  getOrdersByPeriod,
  getTopSellingProducts,
  getSalesByCity,
  getPaymentMethodStats,
  getRecentActivity,
} from "@/actions/admin/analytics";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Colors for charts
const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088fe"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const PAYMENT_COLORS: Record<string, string> = {
  COD: "#6b7280",
  BKASH: "#e91e8c",
  NAGAD: "#f97316",
  ROCKET: "#8b5cf6",
};

interface OverviewData {
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  totalRevenue: number;
  thisMonthOrders: number;
  lastMonthOrders: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  orderGrowth: number;
  ordersByStatus: {
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
  };
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface OrderData {
  date: string;
  orders: number;
}

interface TopProduct {
  id: string;
  title: string;
  slug: string;
  image: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface CityData {
  city: string;
  orders: number;
  revenue: number;
}

interface PaymentData {
  method: string;
  orders: number;
  revenue: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: Date;
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "monthly">("daily");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderData, setOrderData] = useState<OrderData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadPeriodData();
  }, [period]);

  async function loadData() {
    setLoading(true);
    try {
      const [
        overviewResult,
        topProductsResult,
        cityResult,
        paymentResult,
        recentResult,
      ] = await Promise.all([
        getAnalyticsOverview(),
        getTopSellingProducts(5),
        getSalesByCity(5),
        getPaymentMethodStats(),
        getRecentActivity(5),
      ]);

      if (overviewResult.success && overviewResult.data) {
        setOverview(overviewResult.data);
      }

      if (topProductsResult.success && topProductsResult.data) {
        setTopProducts(topProductsResult.data);
      }

      if (cityResult.success && cityResult.data) {
        setCityData(cityResult.data);
      }

      if (paymentResult.success && paymentResult.data) {
        setPaymentData(paymentResult.data);
      }

      if (recentResult.success && recentResult.data) {
        setRecentOrders(recentResult.data as unknown as RecentOrder[]);
      }

      await loadPeriodData();
    } catch (error) {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }

  async function loadPeriodData() {
    try {
      const [revenueResult, orderResult] = await Promise.all([
        getRevenueByPeriod(period),
        getOrdersByPeriod(period),
      ]);

      if (revenueResult.success && revenueResult.data) {
        setRevenueData(revenueResult.data);
      }

      if (orderResult.success && orderResult.data) {
        setOrderData(orderResult.data);
      }
    } catch (error) {
      console.error("Failed to load period data:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            View your store performance and insights
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as "daily" | "monthly")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Last 30 Days</SelectItem>
            <SelectItem value="monthly">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(overview.totalRevenue)}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                {overview.revenueGrowth >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">
                      +{overview.revenueGrowth}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{overview.revenueGrowth}%</span>
                  </>
                )}
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalOrders}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {overview.orderGrowth >= 0 ? (
                  <>
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-green-500">
                      +{overview.orderGrowth}%
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                    <span className="text-red-500">{overview.orderGrowth}%</span>
                  </>
                )}
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Active products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalCustomers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                {period === "daily" ? "Last 30 days" : "Last 12 months"} revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `৳${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatPrice(value as number),
                        "Revenue",
                      ]}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders Overview</CardTitle>
              <CardDescription>
                {period === "daily" ? "Last 30 days" : "Last 12 months"} orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={orderData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [value, "Orders"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Secondary Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Best performing products by sales</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sales data yet
              </p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4">
                    <div className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <div className="relative h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium hover:underline line-clamp-1"
                      >
                        {product.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {product.totalQuantity} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatPrice(product.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales by City */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by City</CardTitle>
            <CardDescription>Revenue distribution by location</CardDescription>
          </CardHeader>
          <CardContent>
            {cityData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sales data yet
              </p>
            ) : (
              <div className="space-y-4">
                {cityData.map((city, index) => (
                  <div key={city.city} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {city.city}
                        </span>
                        <Badge variant="secondary">{city.orders} orders</Badge>
                      </div>
                      <span className="font-medium">
                        {formatPrice(city.revenue)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${
                            (city.revenue /
                              Math.max(...cityData.map((c) => c.revenue))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Orders by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No payment data yet
              </p>
            ) : (
              <div className="flex items-center gap-8">
                <div className="h-[180px] w-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="orders"
                        nameKey="method"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              PAYMENT_COLORS[entry.method] ||
                              COLORS[index % COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          `${value} orders`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {paymentData.map((item, index) => (
                    <div
                      key={item.method}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              PAYMENT_COLORS[item.method] ||
                              COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-sm font-medium">{item.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {item.orders} orders
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No orders yet
              </p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {order.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total)}</p>
                      <Badge className={STATUS_COLORS[order.status] || ""}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Status Summary */}
      {overview && (
        <Card>
          <CardHeader>
            <CardTitle>Order Status Summary</CardTitle>
            <CardDescription>Current status of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {overview.ordersByStatus.pending}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Processing
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {overview.ordersByStatus.processing}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Delivered
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {overview.ordersByStatus.delivered}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  Cancelled
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {overview.ordersByStatus.cancelled}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
