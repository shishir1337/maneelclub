import { getFreeShippingMinimum } from "@/lib/settings";
import CartClient from "./cart-client";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const freeShippingMinimum = await getFreeShippingMinimum();

  return <CartClient freeShippingMinimum={freeShippingMinimum} />;
}
