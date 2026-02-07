import { getMerchantNumbers } from "@/lib/settings";
import CheckoutClient from "./checkout-client";

export default async function CheckoutPage() {
  const merchantNumbers = await getMerchantNumbers();
  
  return <CheckoutClient merchantNumbers={merchantNumbers} />;
}
