"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { formatPrice, formatDate } from "@/lib/format";
import { siteConfig } from "@/lib/constants";

interface OrderItem {
  id: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  product: {
    title: string;
  };
}

interface Order {
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  shippingAddress: string;
  city: string;
  altPhone: string | null;
  shippingCost: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItem[];
  createdAt: Date;
}

interface OrderInvoiceProps {
  order: Order;
}

const paymentMethodLabels: Record<string, string> = {
  COD: "Cash on Delivery",
  BKASH: "bKash",
  NAGAD: "Nagad",
  ROCKET: "Rocket",
};

export const OrderInvoice = forwardRef<HTMLDivElement, OrderInvoiceProps>(
  function OrderInvoice({ order }, ref) {
    return (
      <div 
        ref={ref} 
        className="bg-white p-8 max-w-[800px] mx-auto text-sm"
        style={{ 
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#000",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b pb-6 mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt={siteConfig.name}
              width={60}
              height={60}
              className="object-contain"
            />
            <div>
              <h1 className="text-2xl font-bold">{siteConfig.name}</h1>
              <p className="text-gray-600 text-xs">Premium Clothing Brand</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">INVOICE</h2>
            <p className="text-gray-600">#{order.orderNumber}</p>
            <p className="text-gray-600 text-xs mt-1">
              Date: {formatDate(new Date(order.createdAt))}
            </p>
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 uppercase text-xs tracking-wide">
              Bill To
            </h3>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-gray-600">{order.customerPhone}</p>
            {order.altPhone && (
              <p className="text-gray-600">Alt: {order.altPhone}</p>
            )}
            {order.customerEmail && (
              <p className="text-gray-600">{order.customerEmail}</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 uppercase text-xs tracking-wide">
              Ship To
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap">{order.shippingAddress}</p>
            <p className="text-gray-600 capitalize">{order.city}</p>
          </div>
        </div>

        {/* Order Items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">
                Item
              </th>
              <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">
                Variant
              </th>
              <th className="text-center py-3 px-4 font-semibold text-xs uppercase tracking-wide">
                Qty
              </th>
              <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide">
                Price
              </th>
              <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                <td className="py-3 px-4">{item.product.title}</td>
                <td className="py-3 px-4 text-gray-600">
                  {item.color} / {item.size}
                </td>
                <td className="py-3 px-4 text-center">{item.quantity}</td>
                <td className="py-3 px-4 text-right">{formatPrice(item.price)}</td>
                <td className="py-3 px-4 text-right font-medium">
                  {formatPrice(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Shipping</span>
              <span>{formatPrice(order.shippingCost)}</span>
            </div>
            <div className="flex justify-between py-3 font-bold text-lg">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-gray-600 text-xs uppercase tracking-wide">
                Payment Method
              </span>
              <p className="font-medium">
                {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
              </p>
            </div>
            <div className="text-right">
              <span className="text-gray-600 text-xs uppercase tracking-wide">
                Payment Status
              </span>
              <p className={`font-medium ${
                order.paymentStatus === "PAID" 
                  ? "text-green-600" 
                  : order.paymentStatus === "FAILED" 
                    ? "text-red-600" 
                    : "text-yellow-600"
              }`}>
                {order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 text-center text-gray-500 text-xs">
          <p className="mb-1">Thank you for shopping with {siteConfig.name}!</p>
          <p>
            For any queries, please contact us at{" "}
            <span className="text-gray-700">{siteConfig.email}</span> or{" "}
            <span className="text-gray-700">{siteConfig.whatsapp}</span>
          </p>
          <p className="mt-2">
            Facebook: {siteConfig.facebook.replace("https://www.facebook.com/", "@")}
          </p>
        </div>

        {/* Print-specific styles */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>
    );
  }
);
