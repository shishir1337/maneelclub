"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Calendar,
  Printer,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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
import { formatPrice, formatDate, formatDateWithRelativeTime } from "@/lib/format";
import { ORDER_STATUS, ORDER_STATUSES, PAYMENT_STATUS } from "@/lib/constants";
import { 
  getOrderById, 
  updateOrderStatus, 
  verifyPayment, 
  rejectPayment,
  refreshCourierCheck,
} from "@/actions/admin/orders";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { OrderInvoice } from "@/components/admin/order-invoice";
import type { CourierCheckData } from "@/lib/bdcourier";
import { getCourierItemsFromData, getSummaryFromData } from "@/lib/bdcourier";

interface OrderItem {
  id: string;
  productId: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    slug: string;
    images: string[];
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  altPhone: string | null;
  deliveryNote: string | null;
  shippingCost: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  senderNumber: string | null;
  transactionId: string | null;
  paidAt: Date | null;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  courierCheckData?: CourierCheckData | null;
  courierCheckCheckedAt?: Date | null;
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

// Order timeline steps (CONFIRMED removed - Hold → Processing directly)
const orderTimeline = [
  { status: "PENDING", label: "Hold", icon: Clock },
  { status: "PROCESSING", label: "Processing", icon: Package },
  { status: "SHIPPED", label: "Shipped", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle },
];

export default function AdminOrderDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [courierRefreshLoading, setCourierRefreshLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    setLoading(true);
    try {
      const result = await getOrderById(id);
      if (result.success && result.data) {
        // Convert Decimal fields to numbers
        const orderData = result.data as any;
        setOrder({
          ...orderData,
          shippingCost: Number(orderData.shippingCost),
          subtotal: Number(orderData.subtotal),
          total: Number(orderData.total),
          items: orderData.items.map((item: any) => ({
            ...item,
            price: Number(item.price),
          })),
        });
      } else {
        toast.error(result.error || "Failed to load order");
      }
    } catch (error) {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    if (!order) return;
    setActionLoading(true);
    try {
      const result = await updateOrderStatus(order.id, newStatus);
      if (result.success) {
        setOrder({ ...order, status: newStatus });
        toast.success(`Order status updated to ${newStatus.toLowerCase()}`);
      } else {
        toast.error(result.error || "Failed to update order");
      }
    } catch (error) {
      toast.error("Failed to update order");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerifyPayment() {
    if (!order) return;
    setActionLoading(true);
    try {
      const result = await verifyPayment(order.id);
      if (result.success) {
        setOrder({
          ...order,
          paymentStatus: "PAID",
          paidAt: new Date(),
          status: order.status === "PENDING" ? "PROCESSING" : order.status,
        });
        toast.success("Payment verified successfully");
        setShowPaymentDialog(false);
      } else {
        toast.error(result.error || "Failed to verify payment");
      }
    } catch (error) {
      toast.error("Failed to verify payment");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectPayment() {
    if (!order) return;
    setActionLoading(true);
    try {
      const result = await rejectPayment(order.id, rejectReason);
      if (result.success) {
        setOrder({
          ...order,
          paymentStatus: "FAILED",
          status: "CANCELLED",
        });
        toast.success("Payment rejected and order cancelled");
        setShowPaymentDialog(false);
        setRejectReason("");
      } else {
        toast.error(result.error || "Failed to reject payment");
      }
    } catch (error) {
      toast.error("Failed to reject payment");
    } finally {
      setActionLoading(false);
    }
  }

  function handlePrintInvoice() {
    setShowInvoiceDialog(true);
    // Small delay to ensure dialog is rendered before printing
    setTimeout(() => {
      if (invoiceRef.current) {
        const printContent = invoiceRef.current.innerHTML;
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Invoice - ${order?.orderNumber}</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: system-ui, -apple-system, sans-serif; color: #000; }
                  @media print {
                    @page { size: A4; margin: 1cm; }
                    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                  }
                </style>
              </head>
              <body>${printContent}</body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      }
      setShowInvoiceDialog(false);
    }, 100);
  }

  // Get current step in timeline
  function getCurrentStep(status: OrderStatus): number {
    if (status === "CANCELLED") return -1;
    const index = orderTimeline.findIndex((t) => t.status === status);
    return index >= 0 ? index : 0;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
          <CardContent className="p-0">
            <TableSkeleton columns={5} rows={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Order not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStep = getCurrentStep(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(new Date(order.createdAt))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
          <Badge className={statusColors[order.status]}>{ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label ?? order.status}</Badge>
          <Badge className={paymentMethodColors[order.paymentMethod]}>
            {order.paymentMethod}
          </Badge>
          <Badge className={paymentStatusColors[order.paymentStatus]}>
            {PAYMENT_STATUS[order.paymentStatus as keyof typeof PAYMENT_STATUS]?.label ?? order.paymentStatus}
          </Badge>
        </div>
      </div>

      {/* Order Timeline */}
      {order.status !== "CANCELLED" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {orderTimeline.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <div
                    key={step.status}
                    className="flex flex-col items-center relative flex-1"
                  >
                    {/* Connector line */}
                    {index > 0 && (
                      <div
                        className={`absolute left-0 right-1/2 top-4 h-0.5 -translate-y-1/2 ${
                          index <= currentStep ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                    {index < orderTimeline.length - 1 && (
                      <div
                        className={`absolute left-1/2 right-0 top-4 h-0.5 -translate-y-1/2 ${
                          index < currentStep ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                    {/* Icon */}
                    <div
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <p
                      className={`mt-2 text-xs text-center ${
                        isCurrent ? "font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Notice */}
      {order.status === "CANCELLED" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">This order has been cancelled</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={item.product.images[0] || "/logo.png"}
                      alt={item.product.title}
                      fill
                      className="object-cover"
                      unoptimized={(item.product.images[0] ?? "").startsWith("/uploads/")}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/admin/products/${item.product.id}`}
                      className="font-medium hover:underline line-clamp-1"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {item.color} / {item.size}
                    </p>
                    <p className="text-sm">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <Badge className={paymentMethodColors[order.paymentMethod]}>
                    {order.paymentMethod}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge className={paymentStatusColors[order.paymentStatus]}>
                    {PAYMENT_STATUS[order.paymentStatus as keyof typeof PAYMENT_STATUS]?.label ?? order.paymentStatus}
                  </Badge>
                </div>
              </div>

              {order.paymentMethod !== "COD" && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sender Number</p>
                      <p className="font-mono font-medium">
                        {order.senderNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-mono font-medium">
                        {order.transactionId || "N/A"}
                      </p>
                    </div>
                  </div>
                  {order.paidAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Verified At</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(new Date(order.paidAt))}
                      </p>
                    </div>
                  )}

                  {/* Payment verification actions */}
                  {order.paymentStatus === "PENDING" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => setShowPaymentDialog(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Payment
                      </Button>
                    </div>
                  )}
                </>
              )}

              {order.paymentMethod === "COD" && (
                <p className="text-sm text-muted-foreground">
                  Payment will be collected upon delivery.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Delivery Note */}
          {order.deliveryNote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.deliveryNote}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{order.customerName}</p>
                {order.user && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Registered User
                  </Badge>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{order.customerPhone}</span>
                </div>
                {order.altPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{order.altPhone} (alt)</span>
                  </div>
                )}
                {order.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customerEmail}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{order.shippingAddress}</p>
              <p className="text-sm font-medium mt-2">{order.city}</p>
            </CardContent>
          </Card>

          {/* Courier check */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Courier check
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.courierCheckData ? (
                <>
                  {order.courierCheckData.status === "success" ? (
                    (() => {
                      const summary = getSummaryFromData(order.courierCheckData.data);
                      const items = getCourierItemsFromData(order.courierCheckData.data);
                      if (!items.length && !summary) return <p className="text-sm text-muted-foreground">—</p>;
                      return (
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/60 hover:bg-muted/60">
                                <TableHead className="text-xs font-semibold">Courier</TableHead>
                                <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                                <TableHead className="text-xs font-semibold text-right">Success</TableHead>
                                <TableHead className="text-xs font-semibold text-right">Cancel</TableHead>
                                <TableHead className="text-xs font-semibold text-right">Ratio</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {items.map((c) => (
                                <TableRow key={c.name} className="text-sm">
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {c.logo ? (
                                        <img src={c.logo} alt="" className="h-5 w-5 object-contain shrink-0" />
                                      ) : null}
                                      {c.name}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right tabular-nums">{c.total_parcel}</TableCell>
                                  <TableCell className="text-right tabular-nums text-green-700 dark:text-green-400">{c.success_parcel}</TableCell>
                                  <TableCell className="text-right tabular-nums text-amber-700 dark:text-amber-400">{c.cancelled_parcel}</TableCell>
                                  <TableCell className="text-right tabular-nums">{Math.round(c.success_ratio)}%</TableCell>
                                </TableRow>
                              ))}
                              {summary && (
                                <TableRow className="bg-primary/15 font-semibold text-sm border-t-2 border-primary/30 hover:bg-primary/20">
                                  <TableCell className="py-2.5">Summary</TableCell>
                                  <TableCell className="py-2.5 text-right tabular-nums">{summary.total_parcel}</TableCell>
                                  <TableCell className="py-2.5 text-right tabular-nums text-green-700 dark:text-green-400">{summary.success_parcel}</TableCell>
                                  <TableCell className="py-2.5 text-right tabular-nums text-amber-700 dark:text-amber-400">{summary.cancelled_parcel}</TableCell>
                                  <TableCell className="py-2.5 text-right tabular-nums">{Math.round(summary.success_ratio)}%</TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })()
                  ) : order.courierCheckData.status === "error" ? (
                    <p className="text-sm text-amber-700 dark:text-amber-400">{order.courierCheckData.error ?? "Phone number not found"}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                  {order.courierCheckCheckedAt && (
                    <p className="text-xs text-muted-foreground">
                      Checked at {formatDateWithRelativeTime(new Date(order.courierCheckCheckedAt))}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not checked yet. Use Refresh data to verify customer courier status.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={courierRefreshLoading}
                onClick={async () => {
                  setCourierRefreshLoading(true);
                  const result = await refreshCourierCheck(order.id);
                  setCourierRefreshLoading(false);
                  if (result.success) {
                    setOrder((prev) => prev ? { ...prev, courierCheckData: result.data, courierCheckCheckedAt: new Date() } : null);
                    toast.success("Courier data refreshed");
                  } else {
                    toast.error(result.error ?? "Failed to refresh");
                  }
                }}
              >
                {courierRefreshLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh data
              </Button>
            </CardContent>
          </Card>

          {/* Order Status Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={order.status}
                onValueChange={(value) => handleStatusChange(value as OrderStatus)}
                disabled={actionLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Quick actions */}
              <div className="flex flex-wrap gap-2">
                {order.status === "PENDING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange("PROCESSING")}
                    disabled={actionLoading}
                  >
                    Start Processing
                  </Button>
                )}
                {order.status === "PROCESSING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange("SHIPPED")}
                    disabled={actionLoading}
                  >
                    Mark Shipped
                  </Button>
                )}
                {order.status === "SHIPPED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange("DELIVERED")}
                    disabled={actionLoading}
                  >
                    Mark Delivered
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Verification Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Review the payment details and verify or reject.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Sender Number:</span>
                <span className="font-mono font-medium">{order.senderNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Transaction ID:</span>
                <span className="font-mono font-medium">{order.transactionId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Amount:</span>
                <span className="font-medium">{formatPrice(order.total)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">
                Rejection Reason (optional)
              </label>
              <Input
                placeholder="e.g., Invalid transaction ID"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={handleRejectPayment}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject
            </Button>
            <Button onClick={handleVerifyPayment} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Verify Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden Invoice for Printing */}
      {showInvoiceDialog && (
        <div className="fixed inset-0 bg-background/80 z-50">
          <div className="sr-only">
            <OrderInvoice ref={invoiceRef} order={order} />
          </div>
        </div>
      )}
    </div>
  );
}
