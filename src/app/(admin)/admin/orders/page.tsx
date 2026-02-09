"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MoreHorizontal, Eye, Loader2, CheckCircle, XCircle, Phone, CreditCard, User, Mail, MapPin, Package, Calendar, Copy, Check } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate, formatDateWithRelativeTime } from "@/lib/format";
import { ORDER_STATUS, ORDER_STATUSES, PAYMENT_STATUS, PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { getAdminOrders, updateOrderStatus, verifyPayment, rejectPayment } from "@/actions/admin/orders";
import { toast } from "sonner";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

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
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentDialogOrder, setPaymentDialogOrder] = useState<Order | null>(null);
  const [summaryDialogOrder, setSummaryDialogOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, [customerId]);

  async function loadOrders() {
    setLoading(true);
    try {
      const result = await getAdminOrders({ userId: customerId });

      if (result.success && result.data) {
        setOrders(result.data.orders as unknown as Order[]);
      } else {
        toast.error(result.error || "Failed to load orders");
      }
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to reject payment");
    } finally {
      setActionLoading(null);
    }
  }

  async function copyToClipboard(text: string, fieldId: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
      toast.success("Copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy");
    }
  }

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      (order.senderNumber && order.senderNumber.includes(searchQuery)) ||
      (order.transactionId && order.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesPayment =
      paymentFilter === "all" || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesStatus && matchesPayment;
  });

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

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {orders.length === 0
                          ? "No orders yet"
                          : "No orders match your search"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
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
