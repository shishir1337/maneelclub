"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MoreHorizontal, Eye, Loader2, CheckCircle, XCircle, Phone, CreditCard, User, Mail, MapPin, Package, Calendar, Copy, Check, Truck, RefreshCw, Trash2, Ban } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Pagination } from "@/components/ui/pagination";
import { formatPrice, formatDate, formatDateWithRelativeTime } from "@/lib/format";
import { ORDER_STATUS, ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { getAdminOrders, updateOrderStatus, verifyPayment, rejectPayment, refreshCourierCheck, bulkUpdateOrderStatus, bulkVerifyPayment, bulkRejectPayment, deleteOrder, bulkDeleteOrders } from "@/actions/admin/orders";
import { banIp } from "@/actions/admin/ip-bans";
import { toast } from "sonner";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import type { CourierCheckData } from "@/lib/bdcourier";
import { getCourierItemsFromData, getSummaryFromData } from "@/lib/bdcourier";

const ORDERS_PER_PAGE = 30;

function getCourierStatusLabel(data: CourierCheckData | null | undefined): string {
  if (!data) return "—";
  if (data.status === "error") return data.error ?? "Not found";
  const summary = getSummaryFromData(data.data);
  const items = getCourierItemsFromData(data.data);
  if (summary && summary.total_parcel >= 0) {
    return `${Math.round(summary.success_ratio)}% · ${summary.success_parcel}/${summary.total_parcel} · ${summary.cancelled_parcel} cancel`;
  }
  if (items.length) return items.map((c) => `${c.name} ${Math.round(c.success_ratio)}%`).join(", ");
  return "—";
}

/** For table: "good" (green) ≥80%, "warn" (amber) 50–79%, "risk" (red) <50% or high cancel */
function getCourierRatioVariant(
  data: CourierCheckData | null | undefined
): { ratio: number; variant: "good" | "warn" | "risk" | "none" } | null {
  if (!data || data.status !== "success") return null;
  const summary = getSummaryFromData(data.data);
  if (!summary || summary.total_parcel === 0) return null;
  const ratio = Math.round(summary.success_ratio);
  const cancelRate = summary.cancelled_parcel / summary.total_parcel;
  if (ratio >= 80 && cancelRate <= 0.2) return { ratio, variant: "good" };
  if (ratio >= 50 && cancelRate <= 0.5) return { ratio, variant: "warn" };
  return { ratio, variant: "risk" };
}

interface OrderItem {
  id: string;
  productId: string;
  color?: string;
  size?: string;
  quantity: number;
  price: number;
  product?: {
    id: string;
    title: string;
    slug: string;
    images: string[];
  } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shippingAddress?: string;
  city: string;
  altPhone?: string | null;
  deliveryNote?: string | null;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  senderNumber: string | null;
  transactionId: string | null;
  paidAt: Date | null;
  items: OrderItem[];
  createdAt: Date;
  /** Number of orders from this customer (matched by phone or email). 0 if none. */
  timesPurchased?: number;
  courierCheckData?: CourierCheckData | null;
  courierCheckCheckedAt?: Date | null;
  clientIp?: string | null;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const paymentMethodColors: Record<string, string> = {
  COD: "bg-gray-100 text-gray-800",
  BKASH: "bg-pink-100 text-pink-800",
  NAGAD: "bg-orange-100 text-orange-800",
  ROCKET: "bg-purple-100 text-purple-800",
};

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer") ?? undefined;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkRejectDialogOpen, setBulkRejectDialogOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [paymentDialogOrder, setPaymentDialogOrder] = useState<Order | null>(null);
  const [summaryDialogOrder, setSummaryDialogOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [courierRefreshLoading, setCourierRefreshLoading] = useState<string | null>(null);
  const [banIpOrder, setBanIpOrder] = useState<Order | null>(null);
  const [banIpLoading, setBanIpLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [customerId, searchQuery, statusFilter, paymentFilter]);

  // Clear selection when filters, page, or search change
  useEffect(() => {
    setSelectedOrderIds(new Set());
  }, [currentPage, statusFilter, paymentFilter, searchQuery, customerId]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * ORDERS_PER_PAGE;
      const result = await getAdminOrders({
        userId: customerId,
        limit: ORDERS_PER_PAGE,
        offset,
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? (statusFilter as OrderStatus) : undefined,
        paymentStatus: paymentFilter !== "all" ? (paymentFilter as PaymentStatus) : undefined,
      });

      if (result.success && result.data) {
        setOrders(result.data.orders as unknown as Order[]);
        setTotalCount(result.data.total);
      } else {
        toast.error(result.error || "Failed to load orders");
      }
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [customerId, currentPage, searchQuery, statusFilter, paymentFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setActionLoading(orderId);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        toast.success(`Order status updated to ${newStatus.toLowerCase()}`);
      } else {
        toast.error(result.error || "Failed to update order");
      }
    } catch {
      toast.error("Failed to update order");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleVerifyPayment(orderId: string) {
    setActionLoading(orderId);
    try {
      const result = await verifyPayment(orderId);
      if (result.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, paymentStatus: "PAID" as PaymentStatus, status: order.status === "PENDING" ? "PROCESSING" as OrderStatus : order.status }
              : order
          )
        );
        toast.success("Payment verified successfully");
        setPaymentDialogOrder(null);
      } else {
        toast.error(result.error || "Failed to verify payment");
      }
    } catch {
      toast.error("Failed to verify payment");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectPayment(orderId: string) {
    setActionLoading(orderId);
    try {
      const result = await rejectPayment(orderId, rejectReason);
      if (result.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, paymentStatus: "FAILED" as PaymentStatus, status: "CANCELLED" as OrderStatus }
              : order
          )
        );
        toast.success("Payment rejected and order cancelled");
        setPaymentDialogOrder(null);
        setRejectReason("");
      } else {
        toast.error(result.error || "Failed to reject payment");
      }
    } catch {
      toast.error("Failed to reject payment");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBulkUpdateStatus(status: OrderStatus) {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    try {
      const result = await bulkUpdateOrderStatus(ids, status);
      if (result.success) {
        setOrders((prev) =>
          prev.map((order) =>
            ids.includes(order.id) ? { ...order, status } : order
          )
        );
        setSelectedOrderIds(new Set());
        toast.success(`${result.updated} order(s) updated${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`);
      } else {
        toast.error(result.error || "Failed to update orders");
      }
    } catch {
      toast.error("Failed to update orders");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkVerifyPayment() {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    try {
      const result = await bulkVerifyPayment(ids);
      if (result.success) {
        setOrders((prev) =>
          prev.map((order) =>
            ids.includes(order.id)
              ? {
                  ...order,
                  paymentStatus: "PAID" as PaymentStatus,
                  status: order.status === "PENDING" ? ("PROCESSING" as OrderStatus) : order.status,
                }
              : order
          )
        );
        setSelectedOrderIds(new Set());
        const msg =
          result.skipped > 0
            ? `${result.verified} verified, ${result.skipped} skipped (already paid or COD)`
            : `${result.verified} payment(s) verified`;
        toast.success(msg);
      } else {
        toast.error(result.error || "Failed to verify payments");
      }
    } catch {
      toast.error("Failed to verify payments");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkRejectPayment(reason?: string) {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    setBulkRejectDialogOpen(false);
    try {
      const result = await bulkRejectPayment(ids, reason);
      if (result.success) {
        setOrders((prev) =>
          prev.map((order) =>
            ids.includes(order.id)
              ? { ...order, paymentStatus: "FAILED" as PaymentStatus, status: "CANCELLED" as OrderStatus }
              : order
          )
        );
        setSelectedOrderIds(new Set());
        const msg =
          result.skipped > 0
            ? `${result.rejected} rejected, ${result.skipped} skipped`
            : `${result.rejected} payment(s) rejected`;
        toast.success(msg);
        setRejectReason("");
      } else {
        toast.error(result.error || "Failed to reject payments");
      }
    } catch {
      toast.error("Failed to reject payments");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (!orderId) return;
    setActionLoading(orderId);
    setDeleteOrderId(null);
    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setSelectedOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(orderId);
          return next;
        });
        toast.success("Order deleted");
      } else {
        toast.error(result.error || "Failed to delete order");
      }
    } catch {
      toast.error("Failed to delete order");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleBanIpConfirm() {
    const order = banIpOrder;
    if (!order?.clientIp) return;
    setBanIpLoading(true);
    try {
      const result = await banIp(order.clientIp);
      if (result.success) {
        toast.success("IP banned. This address can no longer place orders.");
        setBanIpOrder(null);
      } else {
        toast.error(result.error || "Failed to ban IP");
      }
    } catch {
      toast.error("Failed to ban IP");
    } finally {
      setBanIpLoading(false);
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedOrderIds);
    if (ids.length === 0) return;
    setBulkActionLoading(true);
    setBulkDeleteDialogOpen(false);
    try {
      const result = await bulkDeleteOrders(ids);
      if (result.success) {
        setOrders((prev) => prev.filter((o) => !ids.includes(o.id)));
        setTotalCount((prev) => Math.max(0, prev - result.deleted));
        setSelectedOrderIds(new Set());
        toast.success(`${result.deleted} order(s) deleted${result.skipped > 0 ? `, ${result.skipped} skipped` : ""}`);
      } else {
        toast.error(result.error || "Failed to delete orders");
      }
    } catch {
      toast.error("Failed to delete orders");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function copyToClipboard(text: string, fieldId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  }

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / ORDERS_PER_PAGE);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-20" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[180px]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={7} rows={8} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">
          Manage customer orders
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order #, name, phone, or TxID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {ORDER_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {PAYMENT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedOrderIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium">
                {selectedOrderIds.size} order(s) selected
              </span>
              <div className="flex flex-wrap gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={bulkActionLoading}
                    >
                      {bulkActionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Update status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {ORDER_STATUSES.map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={() =>
                          handleBulkUpdateStatus(status.value as OrderStatus)
                        }
                        className={
                          status.value === "CANCELLED"
                            ? "text-red-600 focus:text-red-600"
                            : ""
                        }
                      >
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkActionLoading}
                  onClick={handleBulkVerifyPayment}
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-1" />
                  )}
                  Verify payment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkActionLoading}
                  onClick={() => setBulkRejectDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  Reject payment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={bulkActionLoading}
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={bulkActionLoading}
                  onClick={() => setSelectedOrderIds(new Set())}
                >
                  Clear selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Single delete confirmation */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order and its items. Stock will be
              restored for unfilled orders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId && handleDeleteOrder(deleteOrderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === deleteOrderId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban IP confirmation */}
      <AlertDialog open={!!banIpOrder} onOpenChange={(open) => !open && setBanIpOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban this IP?</AlertDialogTitle>
            <AlertDialogDescription>
              {banIpOrder?.clientIp ? (
                <>
                  Are you sure you want to ban <span className="font-mono font-medium">{banIpOrder.clientIp}</span>?
                  This address will no longer be able to place orders. You can unban from IP Bans later.
                </>
              ) : (
                "This address will no longer be able to place orders."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={banIpLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanIpConfirm}
              disabled={banIpLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {banIpLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Ban IP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedOrderIds.size} order(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected orders and their items.
              Stock will be restored for unfilled orders. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Reject Payment Dialog */}
      <Dialog open={bulkRejectDialogOpen} onOpenChange={setBulkRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Reject payment for {selectedOrderIds.size} selected order(s). COD
              and already-paid orders will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm text-muted-foreground">
              Reason (optional)
            </label>
            <Input
              placeholder="e.g., Invalid transaction ID"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleBulkRejectPayment(rejectReason)}
              disabled={bulkActionLoading}
            >
              {bulkActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all on page"
                      checked={
                        orders.length === 0
                          ? false
                          : selectedOrderIds.size === orders.length
                            ? true
                            : selectedOrderIds.size > 0
                              ? "indeterminate"
                              : false
                      }
                      onCheckedChange={() => {
                        if (orders.length === 0) return;
                        if (selectedOrderIds.size === orders.length) {
                          setSelectedOrderIds(new Set());
                        } else {
                          setSelectedOrderIds(new Set(orders.map((o) => o.id)));
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {loading
                          ? "Loading orders..."
                          : totalCount === 0
                          ? "No orders yet"
                          : "No orders match your search"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedOrderIds.has(order.id)}
                          onCheckedChange={(checked) => {
                            setSelectedOrderIds((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(order.id);
                              else next.delete(order.id);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <Link 
                            href={`/admin/orders/${order.id}`}
                            className="font-medium hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {order.items?.length || 0} items
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerPhone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const info = getCourierRatioVariant(order.courierCheckData);
                          const summary = order.courierCheckData?.status === "success" ? getSummaryFromData(order.courierCheckData.data) : null;
                          const label = getCourierStatusLabel(order.courierCheckData);
                          const isRefreshing = courierRefreshLoading === order.id;
                          
                          const handleRefresh = async () => {
                            setCourierRefreshLoading(order.id);
                            const result = await refreshCourierCheck(order.id);
                            setCourierRefreshLoading(null);
                            if (result.success) {
                              setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, courierCheckData: result.data, courierCheckCheckedAt: new Date() } : o)));
                              toast.success("Courier data refreshed");
                            } else {
                              toast.error(result.error ?? "Failed to refresh");
                            }
                          };
                          
                          if (info) {
                            // Calculate gradient: 0% = red, 100% = green
                            const ratio = Math.max(0, Math.min(100, info.ratio));
                            const redPercent = 100 - ratio;

                            return (
                              <div className="flex items-start gap-2">
                                <div className="flex flex-col gap-1 w-full max-w-[120px]" title={label}>
                                  {/* Progress bar */}
                                  <div className="relative h-5 w-full rounded-md overflow-hidden border border-border/50 bg-muted">
                                    {/* Background gradient from red to green */}
                                    <div 
                                      className="absolute inset-0"
                                      style={{
                                        background: `linear-gradient(to right, rgb(239 68 68) 0%, rgb(239 68 68) ${redPercent}%, rgb(34 197 94) ${redPercent}%, rgb(34 197 94) 100%)`,
                                      }}
                                    />
                                    {/* Percentage text overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] tabular-nums">
                                        {info.ratio}%
                                      </span>
                                    </div>
                                  </div>
                                  {summary && summary.total_parcel > 0 && (
                                    <div className="text-xs text-muted-foreground tabular-nums space-y-0.5">
                                      <div>All: {summary.total_parcel}</div>
                                      <div className="text-green-700 dark:text-green-400">Success: {summary.success_parcel}</div>
                                      <div className="text-amber-700 dark:text-amber-400">Cancel: {summary.cancelled_parcel}</div>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  disabled={isRefreshing}
                                  onClick={handleRefresh}
                                  title="Refresh courier data"
                                >
                                  {isRefreshing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            );
                          }
                          // Checked but no parcel history (new customer) - show 0% progress bar
                          if (summary && summary.total_parcel === 0) {
                            return (
                              <div className="flex items-start gap-2">
                                <div className="flex flex-col gap-1 w-full max-w-[120px]" title="No previous courier history - new customer">
                                  {/* Progress bar - 0% = full red */}
                                  <div className="relative h-5 w-full rounded-md overflow-hidden border border-border/50 bg-muted">
                                    <div className="absolute inset-0 bg-red-500" />
                                    {/* Percentage text overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] tabular-nums">
                                        0%
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-muted-foreground tabular-nums space-y-0.5">
                                    <div>All: {summary.total_parcel}</div>
                                    <div className="text-green-700 dark:text-green-400">Success: {summary.success_parcel}</div>
                                    <div className="text-amber-700 dark:text-amber-400">Cancel: {summary.cancelled_parcel}</div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  disabled={isRefreshing}
                                  onClick={handleRefresh}
                                  title="Refresh courier data"
                                >
                                  {isRefreshing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            );
                          }
                          if (order.courierCheckData?.status === "error") {
                            return (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex w-fit rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-400" title={label}>
                                  Not found
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0"
                                  disabled={isRefreshing}
                                  onClick={handleRefresh}
                                  title="Refresh courier data"
                                >
                                  {isRefreshing ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground" title={label}>
                                {label}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                disabled={isRefreshing}
                                onClick={handleRefresh}
                                title="Refresh courier data"
                              >
                                {isRefreshing ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium tabular-nums">
                          {order.timesPurchased ?? 0}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          {order.timesPurchased === 1 ? "order" : "orders"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={paymentMethodColors[order.paymentMethod]}>
                            {order.paymentMethod}
                          </Badge>
                          {order.paymentMethod !== "COD" && order.senderNumber && (
                            <div className="text-xs text-muted-foreground">
                              <p>From: {order.senderNumber}</p>
                              <p>TxID: {order.transactionId}</p>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{formatPrice(order.total)}</p>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            handleStatusChange(order.id, value as OrderStatus)
                          }
                          disabled={actionLoading === order.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            {actionLoading === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Badge className={statusColors[order.status]}>
                                {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label ?? order.status}
                              </Badge>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {ORDER_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {formatDateWithRelativeTime(new Date(order.createdAt))}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSummaryDialogOrder(order)}
                            title="View Order Summary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.clientIp && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setBanIpOrder(order)}
                              title="Ban this IP address"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Payment verification options for non-COD orders */}
                            {order.paymentMethod !== "COD" && order.paymentStatus === "PENDING" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setPaymentDialogOrder(order)}
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Verify Payment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "PENDING")
                              }
                            >
                              Mark as Hold
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "PROCESSING")
                              }
                            >
                              Mark as Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "SHIPPED")
                              }
                            >
                              Mark as Shipped
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "DELIVERED")
                              }
                            >
                              Mark as Delivered
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(order.id, "CANCELLED")
                              }
                              className="text-red-600 focus:text-red-600"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Mark as Canceled
                            </DropdownMenuItem>
                            {order.clientIp && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setBanIpOrder(order)}
                                  className="text-red-600 focus:text-red-600"
                                  disabled={actionLoading === order.id}
                                >
                                  <Ban className="h-4 w-4 mr-2" />
                                  Ban IP
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteOrderId(order.id)}
                              className="text-red-600 focus:text-red-600"
                              disabled={actionLoading === order.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalCount > 0 && (
        <Card>
          <CardContent className="py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalCount}
              itemsPerPage={ORDERS_PER_PAGE}
            />
          </CardContent>
        </Card>
      )}

      {/* Payment Verification Dialog */}
      <Dialog open={!!paymentDialogOrder} onOpenChange={() => setPaymentDialogOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Review the payment details and verify or reject.
            </DialogDescription>
          </DialogHeader>
          
          {paymentDialogOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order</p>
                  <p className="font-medium">{paymentDialogOrder.orderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{formatPrice(paymentDialogOrder.total)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <Badge className={paymentMethodColors[paymentDialogOrder.paymentMethod]}>
                    {paymentDialogOrder.paymentMethod}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{paymentDialogOrder.customerName}</p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Sender Number:</span>
                  <span className="font-mono font-medium">{paymentDialogOrder.senderNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Transaction ID:</span>
                  <span className="font-mono font-medium">{paymentDialogOrder.transactionId}</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Rejection Reason (optional)</label>
                <Input
                  placeholder="e.g., Invalid transaction ID"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => paymentDialogOrder && handleRejectPayment(paymentDialogOrder.id)}
              disabled={actionLoading === paymentDialogOrder?.id}
            >
              {actionLoading === paymentDialogOrder?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
            <Button
              onClick={() => paymentDialogOrder && handleVerifyPayment(paymentDialogOrder.id)}
              disabled={actionLoading === paymentDialogOrder?.id}
            >
              {actionLoading === paymentDialogOrder?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Summary Dialog */}
      <Dialog open={!!summaryDialogOrder} onOpenChange={() => setSummaryDialogOrder(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Order Summary</DialogTitle>
            <DialogDescription>
              Complete overview of order and customer information
            </DialogDescription>
          </DialogHeader>
          
          {summaryDialogOrder && (
            <div className="space-y-4">
              {/* Order Header - Highlighted */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Order Number
                      </p>
                      <p className="text-lg font-bold text-primary">{summaryDialogOrder.orderNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Total Amount
                      </p>
                      <p className="text-2xl font-bold">{formatPrice(summaryDialogOrder.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Order Date
                      </p>
                      <p className="text-sm font-medium">{formatDateWithRelativeTime(new Date(summaryDialogOrder.createdAt))}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Status
                      </p>
                      <Badge className={statusColors[summaryDialogOrder.status]} variant="outline">
                        {ORDER_STATUS[summaryDialogOrder.status as keyof typeof ORDER_STATUS]?.label ?? summaryDialogOrder.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="font-medium truncate">{summaryDialogOrder.customerName}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(summaryDialogOrder.customerName, `name-${summaryDialogOrder.id}`)}
                        >
                          {copiedField === `name-${summaryDialogOrder.id}` ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-1">
                      <div className="flex items-start gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium">{summaryDialogOrder.customerPhone}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(summaryDialogOrder.customerPhone, `phone-${summaryDialogOrder.id}`)}
                        >
                          {copiedField === `phone-${summaryDialogOrder.id}` ? (
                            <Check className="h-3 w-3 text-green-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Alt Phone */}
                    {summaryDialogOrder.altPhone && (
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Alt. Phone</p>
                            <p className="font-medium">{summaryDialogOrder.altPhone}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(summaryDialogOrder.altPhone!, `altPhone-${summaryDialogOrder.id}`)}
                          >
                            {copiedField === `altPhone-${summaryDialogOrder.id}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {summaryDialogOrder.customerEmail && (
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium truncate">{summaryDialogOrder.customerEmail}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(summaryDialogOrder.customerEmail!, `email-${summaryDialogOrder.id}`)}
                          >
                            {copiedField === `email-${summaryDialogOrder.id}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Shipping Address */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Shipping Address</h4>
                      
                      {/* Address */}
                      {summaryDialogOrder.shippingAddress && (
                        <div className="space-y-1">
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Address</p>
                              <p className="font-medium whitespace-pre-wrap break-words">{summaryDialogOrder.shippingAddress}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => copyToClipboard(summaryDialogOrder.shippingAddress!, `address-${summaryDialogOrder.id}`)}
                            >
                              {copiedField === `address-${summaryDialogOrder.id}` ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* City */}
                      <div className="space-y-1">
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">City</p>
                            <p className="font-medium">{summaryDialogOrder.city}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => copyToClipboard(summaryDialogOrder.city, `city-${summaryDialogOrder.id}`)}
                          >
                            {copiedField === `city-${summaryDialogOrder.id}` ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Delivery Note */}
                      {summaryDialogOrder.deliveryNote && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-start gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Delivery Note</p>
                              <p className="font-medium text-xs whitespace-pre-wrap break-words">{summaryDialogOrder.deliveryNote}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => copyToClipboard(summaryDialogOrder.deliveryNote!, `note-${summaryDialogOrder.id}`)}
                            >
                              {copiedField === `note-${summaryDialogOrder.id}` ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {summaryDialogOrder.timesPurchased !== undefined && summaryDialogOrder.timesPurchased > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Previous Orders</p>
                            <p className="font-medium">{summaryDialogOrder.timesPurchased} order{summaryDialogOrder.timesPurchased !== 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Courier check */}
                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Truck className="h-3.5 w-3.5" />
                          Courier check
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={courierRefreshLoading === summaryDialogOrder.id}
                          onClick={async () => {
                            setCourierRefreshLoading(summaryDialogOrder.id);
                            const result = await refreshCourierCheck(summaryDialogOrder.id);
                            setCourierRefreshLoading(null);
                            if (result.success) {
                              setSummaryDialogOrder((prev) => prev ? { ...prev, courierCheckData: result.data, courierCheckCheckedAt: new Date() } : null);
                              setOrders((prev) => prev.map((o) => (o.id === summaryDialogOrder.id ? { ...o, courierCheckData: result.data, courierCheckCheckedAt: new Date() } : o)));
                              toast.success("Courier data refreshed");
                            } else {
                              toast.error(result.error ?? "Failed to refresh");
                            }
                          }}
                        >
                          {courierRefreshLoading === summaryDialogOrder.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          Refresh data
                        </Button>
                      </div>
                      {summaryDialogOrder.courierCheckData ? (
                        summaryDialogOrder.courierCheckData.status === "success" ? (
                          (() => {
                            const summary = getSummaryFromData(summaryDialogOrder.courierCheckData!.data);
                            const items = getCourierItemsFromData(summaryDialogOrder.courierCheckData!.data);
                            if (!items.length && !summary) return <p className="text-xs text-muted-foreground">—</p>;
                            return (
                              <div className="rounded-md border overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                                      <TableHead className="h-8 text-xs font-semibold">Courier</TableHead>
                                      <TableHead className="h-8 text-xs font-semibold text-right">Total</TableHead>
                                      <TableHead className="h-8 text-xs font-semibold text-right">Success</TableHead>
                                      <TableHead className="h-8 text-xs font-semibold text-right">Cancel</TableHead>
                                      <TableHead className="h-8 text-xs font-semibold text-right">Ratio</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {items.map((c) => (
                                      <TableRow key={c.name} className="text-xs">
                                        <TableCell className="py-1.5 font-medium">{c.name}</TableCell>
                                        <TableCell className="py-1.5 text-right tabular-nums">{c.total_parcel}</TableCell>
                                        <TableCell className="py-1.5 text-right tabular-nums text-green-700">{c.success_parcel}</TableCell>
                                        <TableCell className="py-1.5 text-right tabular-nums text-amber-700">{c.cancelled_parcel}</TableCell>
                                        <TableCell className="py-1.5 text-right tabular-nums">{Math.round(c.success_ratio)}%</TableCell>
                                      </TableRow>
                                    ))}
                                    {summary && (
                                      <TableRow className="bg-primary/10 font-semibold text-xs border-t-2 border-primary/20">
                                        <TableCell className="py-1.5">Summary</TableCell>
                                        <TableCell className="py-1.5 text-right tabular-nums">{summary.total_parcel}</TableCell>
                                        <TableCell className="py-1.5 text-right tabular-nums text-green-700">{summary.success_parcel}</TableCell>
                                        <TableCell className="py-1.5 text-right tabular-nums text-amber-700">{summary.cancelled_parcel}</TableCell>
                                        <TableCell className="py-1.5 text-right tabular-nums">{Math.round(summary.success_ratio)}%</TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-xs text-amber-700">{summaryDialogOrder.courierCheckData.error ?? "Not found"}</p>
                        )
                      ) : (
                        <p className="text-xs text-muted-foreground">Not checked</p>
                      )}
                      {summaryDialogOrder.courierCheckCheckedAt && (
                        <p className="text-xs text-muted-foreground">
                          Checked at {formatDateWithRelativeTime(new Date(summaryDialogOrder.courierCheckCheckedAt))}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Method</p>
                      <Badge className={paymentMethodColors[summaryDialogOrder.paymentMethod]} variant="outline">
                        {summaryDialogOrder.paymentMethod}
                      </Badge>
                    </div>
                    {summaryDialogOrder.paymentMethod !== "COD" && (
                      <div className="pt-2 border-t space-y-2">
                        {summaryDialogOrder.senderNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Sender Number</p>
                              <p className="font-mono font-medium text-xs break-all">{summaryDialogOrder.senderNumber}</p>
                            </div>
                          </div>
                        )}
                        {summaryDialogOrder.transactionId && (
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">Transaction ID</p>
                              <p className="font-mono font-medium text-xs break-all">{summaryDialogOrder.transactionId}</p>
                            </div>
                          </div>
                        )}
                        {summaryDialogOrder.paidAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground">Paid At</p>
                              <p className="font-medium text-xs">{formatDate(new Date(summaryDialogOrder.paidAt))}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Order Items
                    <Badge variant="secondary" className="ml-auto">
                      {summaryDialogOrder.items?.length || 0} item{summaryDialogOrder.items?.length !== 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {summaryDialogOrder.items && summaryDialogOrder.items.length > 0 ? (
                      summaryDialogOrder.items.map((item, index) => {
                        const productTitle = item.product?.title || "Product";
                        const hasVariants = item.color || item.size;
                        
                        return (
                          <div 
                            key={item.id} 
                            className={`flex items-start justify-between p-3 rounded-lg border bg-card ${
                              index !== summaryDialogOrder.items!.length - 1 ? "mb-2" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm leading-tight">{productTitle}</p>
                                  {hasVariants && (
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {item.color && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                          {item.color}
                                        </span>
                                      )}
                                      {item.size && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                          {item.size}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {item.quantity} × {formatPrice(item.price)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-4 shrink-0">
                              <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No items found</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSummaryDialogOrder(null)}>
              Close
            </Button>
            {summaryDialogOrder && (
              <Button asChild>
                <Link href={`/admin/orders/${summaryDialogOrder.id}`}>
                  View Full Details
                </Link>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
