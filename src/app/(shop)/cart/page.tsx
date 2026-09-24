import { getFreeShippingMinimum } from "@/lib/settings";
import { getActivePromotions } from "@/lib/promotions";
import CartClient from "./cart-client";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [freeShippingMinimum, promotions] = await Promise.all([
    getFreeShippingMinimum(),
    getActivePromotions(),
  ]);

  return <CartClient freeShippingMinimum={freeShippingMinimum} promotions={promotions} />;
}
