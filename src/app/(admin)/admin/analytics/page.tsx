"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Users,
  UserPlus,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Download,
  Layers,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ComposedChart,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS } from "@/lib/constants";
import {
  getAnalyticsOverview,
  getRevenueByPeriod,
  getOrdersByPeriod,
  getOrdersByStatusOverTime,
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
  SHIPPED: "bg-green-100 text-green-700",
  DELIVERED: "bg-green-200 text-green-900",
  CANCELLED: "bg-red-100 text-red-800",
};

const STATUS_CHART_COLORS: Record<string, string> = {
  PENDING: "#eab308",
  CONFIRMED: "#3b82f6",
  PROCESSING: "#a855f7",
  SHIPPED: "#22c55e",
  DELIVERED: "#16a34a",
  CANCELLED: "#ef4444",
};

const ORDER_STATUS_KEYS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

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
  totalQuantitySold: number;
  totalQuantityOrdered: number;
  totalQuantityCancelled: number;
  thisMonthOrders: number;
  lastMonthOrders: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  orderGrowth: number;
  quantityGrowth?: number;
  averageOrderValue: number;
  cancellationRate: number;
  newCustomers: number;
  previousPeriodRevenue?: number;
  previousPeriodOrders?: number;
  previousPeriodQuantitySold?: number;
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

interface StatusOverTimeData {
  date: string;
  PENDING: number;
  CONFIRMED: number;
  PROCESSING: number;
  SHIPPED: number;
  DELIVERED: number;
  CANCELLED: number;
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

type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "last12months"
  | "custom";

function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRangeFromPreset(
  preset: DateRangePreset,
  customFrom: string,
  customTo: string
): { dateFrom: string; dateTo: string } | null {
  const now = new Date();
  if (preset === "custom") {
    if (!customFrom || !customTo || customFrom > customTo) return null;
    return { dateFrom: customFrom, dateTo: customTo };
  }
  let start: Date;
  let end: Date;
  if (preset === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (preset === "yesterday") {
    start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setHours(23, 59, 59, 999);
  } else if (preset === "last7") {
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (preset === "last30") {
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    start = new Date(end);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else {
    // last12months
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    start = new Date(end);
    start.setMonth(start.getMonth() - 12);
    start.setHours(0, 0, 0, 0);
  }
  return {
    dateFrom: toLocalDateString(start),
    dateTo: toLocalDateString(end),
  };
}

function formatRangeLabel(dateFrom: string, dateTo: string): string {
  const from = new Date(dateFrom + "T12:00:00");
  const to = new Date(dateTo + "T12:00:00");
  if (dateFrom === dateTo) {
    return from.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  return `${from.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${to.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildAnalyticsCsv(params: {
  rangeLabel: string;
  overview: OverviewData | null;
  topProducts: TopProduct[];
  cityData: CityData[];
  paymentData: PaymentData[];
  recentOrders: RecentOrder[];
  revenueData: RevenueData[];
  orderData: OrderData[];
}): string {
  const { rangeLabel, overview, topProducts, cityData, paymentData, recentOrders, revenueData, orderData } = params;
  const lines: string[] = [];
  const now = new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

  lines.push("Analytics Report");
  lines.push(`Period,${escapeCsvCell(rangeLabel || "All")}`);
  lines.push(`Generated,${escapeCsvCell(now)}`);
  lines.push("");

  if (overview) {
    lines.push("Overview");
    lines.push("Metric,Value");
    lines.push(`Total Revenue,${escapeCsvCell(overview.totalRevenue)}`);
    lines.push(`Total Orders,${escapeCsvCell(overview.totalOrders)}`);
    lines.push(`Units Sold (ex. cancelled),${escapeCsvCell(overview.totalQuantitySold)}`);
    lines.push(`Units Ordered (incl. cancelled),${escapeCsvCell(overview.totalQuantityOrdered)}`);
    lines.push(`Units Cancelled,${escapeCsvCell(overview.totalQuantityCancelled)}`);
    lines.push(`Products,${escapeCsvCell(overview.totalProducts)}`);
    lines.push(`Customers,${escapeCsvCell(overview.totalCustomers)}`);
    lines.push(`Average Order Value,${escapeCsvCell(overview.averageOrderValue)}`);
    lines.push(`Cancellation Rate %,${escapeCsvCell(overview.cancellationRate)}`);
    lines.push(`New Customers,${escapeCsvCell(overview.newCustomers)}`);
    lines.push("");
  }

  lines.push("Top Selling Products");
  lines.push("Title,Quantity Sold,Revenue");
  topProducts.forEach((p) => {
    lines.push(`${escapeCsvCell(p.title)},${escapeCsvCell(p.totalQuantity)},${escapeCsvCell(p.totalRevenue)}`);
  });
  lines.push("");

  lines.push("Sales by City");
  lines.push("City,Orders,Revenue");
  cityData.forEach((c) => {
    lines.push(`${escapeCsvCell(c.city)},${escapeCsvCell(c.orders)},${escapeCsvCell(c.revenue)}`);
  });
  lines.push("");

  lines.push("Payment Methods");
  lines.push("Method,Orders,Revenue");
  paymentData.forEach((p) => {
    lines.push(`${escapeCsvCell(p.method)},${escapeCsvCell(p.orders)},${escapeCsvCell(p.revenue)}`);
  });
  lines.push("");

  lines.push("Recent Orders");
  lines.push("Order Number,Customer,Total,Status,Date");
  recentOrders.forEach((o) => {
    const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-GB") : "";
    lines.push(`${escapeCsvCell(o.orderNumber)},${escapeCsvCell(o.customerName)},${escapeCsvCell(o.total)},${escapeCsvCell(o.status)},${escapeCsvCell(date)}`);
  });
  lines.push("");

  lines.push("Revenue by Date");
  lines.push("Date,Revenue");
  revenueData.forEach((r) => {
    lines.push(`${escapeCsvCell(r.date)},${escapeCsvCell(r.revenue)}`);
  });
  lines.push("");

  lines.push("Orders by Date");
  lines.push("Date,Orders");
  orderData.forEach((r) => {
    lines.push(`${escapeCsvCell(r.date)},${escapeCsvCell(r.orders)}`);
  });

  return lines.join("\r\n");
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangePreset>("last30");
  const [customFrom, setCustomFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return toLocalDateString(d);
  });
  const [customTo, setCustomTo] = useState(() => toLocalDateString(new Date()));
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [orderData, setOrderData] = useState<OrderData[]>([]);
  const [statusOverTimeData, setStatusOverTimeData] = useState<StatusOverTimeData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [rangeLabel, setRangeLabel] = useState<string>("");

  useEffect(() => {
    const r = getRangeFromPreset(dateRange, customFrom, customTo);
    if (!r) return;
    setRangeLabel(formatRangeLabel(r.dateFrom, r.dateTo));
    loadData(r);
  }, [dateRange, customFrom, customTo]);

  async function loadData(r: { dateFrom: string; dateTo: string }) {
    setLoading(true);
    setOverview(null);
    setTopProducts([]);
    setCityData([]);
    setPaymentData([]);
    setRecentOrders([]);
    try {
      const [
        overviewResult,
        topProductsResult,
        cityResult,
        paymentResult,
        recentResult,
      ] = await Promise.all([
        getAnalyticsOverview(r.dateFrom, r.dateTo),
        getTopSellingProducts(5, { dateFrom: r.dateFrom, dateTo: r.dateTo }),
        getSalesByCity(5, r.dateFrom, r.dateTo),
        getPaymentMethodStats(r.dateFrom, r.dateTo),
        getRecentActivity(5, r.dateFrom, r.dateTo),
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

      const [revenueResult, orderResult, statusOverTimeResult] = await Promise.all([
        getRevenueByPeriod("daily", r.dateFrom, r.dateTo),
        getOrdersByPeriod("daily", r.dateFrom, r.dateTo),
        getOrdersByStatusOverTime(r.dateFrom, r.dateTo),
      ]);

      if (revenueResult.success && revenueResult.data) {
        setRevenueData(revenueResult.data);
      }
      if (orderResult.success && orderResult.data) {
        setOrderData(orderResult.data);
      }
      if (statusOverTimeResult.success && statusOverTimeResult.data) {
        setStatusOverTimeData(statusOverTimeResult.data as StatusOverTimeData[]);
      }
    } catch {
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 pb-8">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 w-[180px]" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
                <CardContent><Skeleton className="h-8 w-20" /></CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-[320px] w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Toolbar: period + export */}
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rangeLabel ? (
                <span className="font-medium text-foreground">Reporting period: {rangeLabel}</span>
              ) : (
                "Select a period to view performance"
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={dateRange}
              onValueChange={(value) => setDateRange(value as DateRangePreset)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="last12months">Last 12 months</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const csv = buildAnalyticsCsv({
                  rangeLabel,
                  overview,
                  topProducts,
                  cityData,
                  paymentData,
                  recentOrders,
                  revenueData,
                  orderData,
                });
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `analytics-${rangeLabel ? rangeLabel.replace(/\s*–\s*/g, "-").replace(/,/g, "").replace(/\s+/g, "-") : "report"}-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Report downloaded");
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
        {dateRange === "custom" && customFrom > customTo && (
          <p className="text-sm text-destructive">
            From date must be before or equal to To date.
          </p>
        )}
      </div>

      {/* Section: Key metrics */}
      {overview && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Key metrics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
          <Card className="border-primary/20 bg-primary/5">
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
                <span className="ml-1">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
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
                <span className="ml-1">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Units Sold</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.totalQuantitySold.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {overview.quantityGrowth !== undefined
                  ? `vs prev: ${overview.quantityGrowth >= 0 ? "+" : ""}${overview.quantityGrowth}%`
                  : "Pieces in selected period"}
              </p>
              {(overview.totalQuantityOrdered > 0 || overview.totalQuantityCancelled > 0) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalQuantityOrdered.toLocaleString()} ordered
                  {overview.totalQuantityCancelled > 0 && (
                    <> · <span className="text-amber-600 dark:text-amber-400">{overview.totalQuantityCancelled.toLocaleString()} cancelled</span></>
                  )}
                </p>
              )}
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPrice(overview.averageOrderValue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue ÷ orders in selected period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.cancellationRate}%</div>
              <p className="text-xs text-muted-foreground">
                {overview.ordersByStatus.cancelled} cancelled of {overview.totalOrders} orders
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Customers</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.newCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Signed up in selected period
              </p>
            </CardContent>
          </Card>
          </div>
        </section>
      )}

      {/* Section: Period comparison */}
      {overview && overview.previousPeriodRevenue !== undefined && overview.previousPeriodOrders !== undefined && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Period comparison
          </h2>
          <Card>
          <CardHeader>
            <CardTitle>This period vs previous period</CardTitle>
            <CardDescription>
              Same-length period immediately before the selected range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">This period</TableHead>
                  <TableHead className="text-right">Previous period</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Revenue</TableCell>
                  <TableCell className="text-right">{formatPrice(overview.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatPrice(overview.previousPeriodRevenue ?? 0)}</TableCell>
                  <TableCell className="text-right">
                    {overview.revenueGrowth >= 0 ? (
                      <span className="text-green-600">+{overview.revenueGrowth}%</span>
                    ) : (
                      <span className="text-red-600">{overview.revenueGrowth}%</span>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Orders</TableCell>
                  <TableCell className="text-right">{overview.totalOrders}</TableCell>
                  <TableCell className="text-right">{overview.previousPeriodOrders ?? 0}</TableCell>
                  <TableCell className="text-right">
                    {overview.orderGrowth >= 0 ? (
                      <span className="text-green-600">+{overview.orderGrowth}%</span>
                    ) : (
                      <span className="text-red-600">{overview.orderGrowth}%</span>
                    )}
                  </TableCell>
                </TableRow>
                {overview.previousPeriodQuantitySold !== undefined && (
                  <TableRow>
                    <TableCell className="font-medium">Units sold</TableCell>
                    <TableCell className="text-right">{overview.totalQuantitySold.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{overview.previousPeriodQuantitySold.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {overview.quantityGrowth != null && (overview.quantityGrowth >= 0 ? (
                        <span className="text-green-600">+{overview.quantityGrowth}%</span>
                      ) : (
                        <span className="text-red-600">{overview.quantityGrowth}%</span>
                      ))}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </section>
      )}

      {/* Section: Trends */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Trends over time
        </h2>
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="revenue-orders">Revenue & Orders</TabsTrigger>
          <TabsTrigger value="order-status">Order Status</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>
                {rangeLabel ? `${rangeLabel} · revenue` : "Revenue by period"}
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
                {rangeLabel ? `${rangeLabel} · orders` : "Orders by period"}
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

        <TabsContent value="revenue-orders">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Orders</CardTitle>
              <CardDescription>
                {rangeLabel ? `${rangeLabel} · revenue and order count` : "Revenue and orders by period"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={revenueData.map((r, i) => ({
                      date: r.date,
                      revenue: r.revenue,
                      orders: orderData[i]?.orders ?? 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      yAxisId="revenue"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `৳${value / 1000}k`}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        name === "revenue" ? formatPrice(value as number) : value,
                        name === "revenue" ? "Revenue" : "Orders",
                      ]}
                    />
                    <Legend />
                    <Bar
                      yAxisId="revenue"
                      dataKey="revenue"
                      name="Revenue"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="order-status">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Over Time</CardTitle>
              <CardDescription>
                {rangeLabel ? `${rangeLabel} · orders by status` : "Orders by status per period"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Legend />
                    {ORDER_STATUS_KEYS.map((status) => (
                      <Bar
                        key={status}
                        dataKey={status}
                        name={ORDER_STATUS[status as keyof typeof ORDER_STATUS]?.label ?? status}
                        stackId="status"
                        fill={STATUS_CHART_COLORS[status] ?? COLORS[0]}
                        radius={status === "CANCELLED" ? [4, 4, 0, 0] : 0}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </section>

      {/* Section: Breakdowns */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Breakdowns
        </h2>
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
                        unoptimized={(product.image ?? "").startsWith("/uploads/")}
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
                {cityData.map((city) => (
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
                        {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label ?? order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </section>

      {/* Section: Order pipeline */}
      {overview && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Order pipeline
          </h2>
        <Card>
          <CardHeader>
            <CardTitle>Order status in period</CardTitle>
            <CardDescription>Orders by current status in the selected range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Hold
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
        </section>
      )}
    </div>
  );
}
