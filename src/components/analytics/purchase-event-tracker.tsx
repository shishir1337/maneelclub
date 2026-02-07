"use client";

import { useEffect, useRef } from "react";
import { trackPurchase } from "@/lib/data-layer";

/**
 * Pushes Purchase event to the data layer once when order confirmation is shown.
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
  }, [orderNumber, value, numItems, contentIds]);

  return null;
}
