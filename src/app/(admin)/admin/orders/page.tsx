"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MoreHorizontal, Eye, Loader2, CheckCircle, XCircle, Phone, CreditCard } from "lucide-react";
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
import { formatPrice, formatDate } from "@/lib/format";
import { ORDER_STATUS, ORDER_STATUSES, PAYMENT_STATUS, PAYMENT_STATUSES, PAYMENT_METHODS } from "@/lib/constants";
import { getAdminOrders, updateOrderStatus, verifyPayment, rejectPayment } from "@/actions/admin/orders";
import { toast } from "sonner";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  city: string;
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
  const [rejectReason, setRejectReason] = useState("");

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
                          <Badge className={paymentStatusColors[order.paymentStatus]}>
                            {PAYMENT_STATUS[order.paymentStatus as keyof typeof PAYMENT_STATUS]?.label ?? order.paymentStatus}
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
                          {formatDate(new Date(order.createdAt))}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
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
                          </DropdownMenuContent>
                        </DropdownMenu>
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
    </div>
  );
}
