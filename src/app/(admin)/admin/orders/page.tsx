"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MoreHorizontal, Eye, Loader2, CheckCircle, XCircle, Phone, CreditCard, Copy, Check, RefreshCw, Trash2, Ban } from "lucide-react";
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
import { Pagination } from "@/components/ui/pagination";
import { formatPrice, formatDateWithRelativeTime } from "@/lib/format";
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
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

  // Debounce search so we don't refetch on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [customerId, debouncedSearchQuery, statusFilter, paymentFilter]);

  // Clear selection when filters, page, or search change
  useEffect(() => {
    setSelectedOrderIds(new Set());
  }, [currentPage, statusFilter, paymentFilter, debouncedSearchQuery, customerId]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (currentPage - 1) * ORDERS_PER_PAGE;
      const result = await getAdminOrders({
        userId: customerId,
        limit: ORDERS_PER_PAGE,
        offset,
        search: debouncedSearchQuery || undefined,
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
  }, [customerId, currentPage, debouncedSearchQuery, statusFilter, paymentFilter]);

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

      {/* Order Summary Dialog - compact, admin-optimized layout */}
      <Dialog open={!!summaryDialogOrder} onOpenChange={() => setSummaryDialogOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0" showCloseButton={false}>
          {summaryDialogOrder && (
            <>
              {/* Header: order number, status badge (no X - use footer Close) */}
              <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b bg-muted/20 shrink-0">
                <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                  Order #{summaryDialogOrder.orderNumber}
                </DialogTitle>
                <Badge className={`${statusColors[summaryDialogOrder.status]} shrink-0 font-medium`} variant="outline">
                  {ORDER_STATUS[summaryDialogOrder.status as keyof typeof ORDER_STATUS]?.label ?? summaryDialogOrder.status}
                </Badge>
              </div>

              {/* Scrollable body */}
              <div className="overflow-y-auto px-5 py-4 space-y-4">
                {/* Row 1: Customer | Shipping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-card p-3.5 shadow-sm">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Customer</p>
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm truncate flex-1 min-w-0">{summaryDialogOrder.customerName}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(summaryDialogOrder.customerName, `name-${summaryDialogOrder.id}`)}>
                        {copiedField === `name-${summaryDialogOrder.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm tabular-nums flex-1 min-w-0">{summaryDialogOrder.customerPhone}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(summaryDialogOrder.customerPhone, `phone-${summaryDialogOrder.id}`)}>
                        {copiedField === `phone-${summaryDialogOrder.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    {summaryDialogOrder.altPhone && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-sm tabular-nums text-muted-foreground flex-1 min-w-0">Alt: {summaryDialogOrder.altPhone}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(summaryDialogOrder.altPhone!, `altPhone-${summaryDialogOrder.id}`)}>
                          {copiedField === `altPhone-${summaryDialogOrder.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    )}
                    {summaryDialogOrder.customerEmail && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate flex-1 min-w-0">{summaryDialogOrder.customerEmail}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => copyToClipboard(summaryDialogOrder.customerEmail!, `email-${summaryDialogOrder.id}`)}>
                          {copiedField === `email-${summaryDialogOrder.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border bg-card p-3.5 shadow-sm">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shipping address</p>
                    {summaryDialogOrder.shippingAddress && (
                      <div className="flex items-start gap-1.5">
                        <p className="text-sm whitespace-pre-line line-clamp-3 text-foreground flex-1 min-w-0">{summaryDialogOrder.shippingAddress}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground mt-0.5" onClick={() => copyToClipboard(summaryDialogOrder.shippingAddress!, `address-${summaryDialogOrder.id}`)}>
                          {copiedField === `address-${summaryDialogOrder.id}` ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    )}
                    <p className="text-sm font-medium mt-0.5">{summaryDialogOrder.city}</p>
                  </div>
                </div>

                {/* Order note - separate section for visibility */}
                {summaryDialogOrder.deliveryNote && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30 p-3.5">
                    <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-1.5">Order note</p>
                    <p className="text-sm whitespace-pre-wrap text-amber-900 dark:text-amber-100">{summaryDialogOrder.deliveryNote}</p>
                  </div>
                )}

                {/* Row 2: Payment | Courier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-card p-3.5 shadow-sm">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Payment</p>
                    <Badge className={paymentMethodColors[summaryDialogOrder.paymentMethod]} variant="outline">
                      {summaryDialogOrder.paymentMethod}
                    </Badge>
                    {summaryDialogOrder.paymentMethod !== "COD" && (summaryDialogOrder.senderNumber || summaryDialogOrder.transactionId) && (
                      <div className="mt-2 space-y-0.5">
                        {summaryDialogOrder.senderNumber && <p className="text-xs font-mono break-all">{summaryDialogOrder.senderNumber}</p>}
                        {summaryDialogOrder.transactionId && <p className="text-xs font-mono text-muted-foreground break-all">{summaryDialogOrder.transactionId}</p>}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border bg-card p-3.5 shadow-sm">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Courier check</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs shrink-0"
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
                        {courierRefreshLoading === summaryDialogOrder.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        <span className="ml-1">Refresh</span>
                      </Button>
                    </div>
                    {summaryDialogOrder.courierCheckData?.status === "success" ? (
                      (() => {
                        const summary = getSummaryFromData(summaryDialogOrder.courierCheckData!.data);
                        if (!summary) return <p className="text-xs text-muted-foreground">—</p>;
                        const ratio = Math.round(summary.success_ratio);
                        const ratioColor = ratio >= 80 ? "text-green-700 dark:text-green-400 font-semibold" : ratio >= 50 ? "text-amber-700 dark:text-amber-400 font-medium" : "text-red-700 dark:text-red-400 font-semibold";
                        return (
                          <p className="text-sm tabular-nums">
                            <span className={ratioColor}>{ratio}%</span>
                            <span className="text-muted-foreground"> success</span>
                            <span className="text-muted-foreground"> · </span>
                            <span className="text-green-600 dark:text-green-500 font-medium">{summary.success_parcel}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="font-medium">{summary.total_parcel}</span>
                            <span className="text-muted-foreground"> parcels</span>
                          </p>
                        );
                      })()
                    ) : summaryDialogOrder.courierCheckData?.status === "error" ? (
                      <p className="text-xs text-amber-700 dark:text-amber-400">{summaryDialogOrder.courierCheckData.error ?? "Not found"}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Not checked</p>
                    )}
                  </div>
                </div>

                {/* Order items */}
                <div className="rounded-lg border overflow-hidden bg-card shadow-sm">
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-muted/40 border-b">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Order items
                    </span>
                    <span className="text-xs font-medium tabular-nums">
                      {summaryDialogOrder.items?.length || 0} item{(summaryDialogOrder.items?.length ?? 0) !== 1 ? "s" : ""} · {formatPrice(summaryDialogOrder.total)} total
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                        <TableHead className="h-9 text-xs font-semibold">Product</TableHead>
                        <TableHead className="h-9 text-xs font-semibold w-20">Color</TableHead>
                        <TableHead className="h-9 text-xs font-semibold w-16">Size</TableHead>
                        <TableHead className="h-9 text-xs font-semibold w-14 text-right">Qty</TableHead>
                        <TableHead className="h-9 text-xs font-semibold text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summaryDialogOrder.items?.map((item) => (
                        <TableRow key={item.id} className="text-xs">
                          <TableCell className="py-2.5 font-medium">{item.product?.title ?? "—"}</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">{item.color || "—"}</TableCell>
                          <TableCell className="py-2.5 text-muted-foreground">{item.size || "—"}</TableCell>
                          <TableCell className="py-2.5 text-right tabular-nums">{item.quantity}</TableCell>
                          <TableCell className="py-2.5 text-right font-medium tabular-nums">{formatPrice(item.price * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Change status: colored status buttons */}
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Change status</p>
                  <div className="flex flex-wrap gap-2">
                    {ORDER_STATUSES.filter((s) => s.value !== "CONFIRMED").map((status) => {
                      const isActive = summaryDialogOrder.status === status.value;
                      return (
                        <Button
                          key={status.value}
                          variant="ghost"
                          size="sm"
                          className={`h-8 min-w-[4.5rem] text-xs font-medium border ${status.color} hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 ${isActive ? "ring-2 ring-offset-2 ring-foreground/30 ring-offset-background" : ""}`}
                          disabled={actionLoading === summaryDialogOrder.id}
                          onClick={() => handleStatusChange(summaryDialogOrder.id, status.value as OrderStatus)}
                        >
                          {status.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer: Close + View Full Details */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t bg-muted/10 shrink-0">
                <Button variant="outline" onClick={() => setSummaryDialogOrder(null)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/admin/orders/${summaryDialogOrder.id}`}>View full order</Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
