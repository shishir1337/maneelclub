"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  CreditCard,
  Truck,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice, formatDate } from "@/lib/format";
import { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_STATUSES, ORDER_STATUSES } from "@/lib/constants";
import { getOrderForUser } from "@/actions/orders";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItemType {
  id: string;
  title: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  product: { images: string[]; slug: string } | null;
}

interface OrderType {
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
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  senderNumber: string | null;
  transactionId: string | null;
  items: OrderItemType[];
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

const paymentStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export default function DashboardOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setOrderId(p.id));
  }, [params]);

  useEffect(() => {
    if (!orderId) return;
    const id: string = orderId;
    async function load() {
      const result = await getOrderForUser(id);
      if (result.success && result.data) {
        setOrder(result.data as OrderType);
      } else {
        toast.error(result.error || "Order not found");
      }
      setLoading(false);
    }
    load();
  }, [orderId]);

  if (loading || !orderId) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            Order not found or you don’t have access to it.
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColor = statusColors[order.status] ?? "bg-muted text-muted-foreground";
  const paymentStatusColor = paymentStatusColors[order.paymentStatus] ?? "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
          <Calendar className="h-4 w-4" />
          Placed on {formatDate(new Date(order.createdAt))}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge className={statusColor}>{ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label ?? order.status}</Badge>
        <Badge className={paymentStatusColor}>{PAYMENT_STATUS[order.paymentStatus as keyof typeof PAYMENT_STATUS]?.label ?? order.paymentStatus}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Shipping & contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {order.customerName}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {order.customerPhone}
            </p>
            {order.customerEmail && (
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {order.customerEmail}
              </p>
            )}
            <p className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span>{order.shippingAddress}, {order.city}</span>
            </p>
            {order.deliveryNote && (
              <p className="text-muted-foreground italic">Note: {order.deliveryNote}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Method: <span className="font-medium">{order.paymentMethod}</span></p>
            <p>Status: <Badge className={paymentStatusColor}>{PAYMENT_STATUS[order.paymentStatus as keyof typeof PAYMENT_STATUS]?.label ?? order.paymentStatus}</Badge></p>
            {order.transactionId && (
              <p className="text-muted-foreground">Transaction ID: {order.transactionId}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4 py-3 border-b last:border-0">
                <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted shrink-0">
                  <Image
                    src={item.product?.images?.[0] ?? "/productImage.jpeg"}
                    alt={item.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={item.product ? `/product/${item.product.slug}` : "/shop"}
                    className="font-medium text-primary hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {item.color} / {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
