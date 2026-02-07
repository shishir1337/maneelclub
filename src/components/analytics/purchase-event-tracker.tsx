"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/data-layer";
import { useCartStore } from "@/store/cart-store";

/**
 * Pushes Purchase event to the data layer and clears cart once when order confirmation is shown.
 * Use on the order confirmation page; pass orderNumber and value from the order.
 */
interface PurchaseEventTrackerProps {
  orderNumber: string;
  value: number;
  numItems?: number;
  contentIds?: string[];
}

export function PurchaseEventTracker({
  orderNumber,
  value,
  numItems,
  contentIds,
}: PurchaseEventTrackerProps) {
  const fired = useRef(false);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackPurchase({
      order_id: orderNumber,
      value,
      num_items: numItems,
      content_ids: contentIds,
      event_id: orderNumber,
    });
    clearCart();
  }, [orderNumber, value, numItems, contentIds, clearCart]);

  return null;
}
