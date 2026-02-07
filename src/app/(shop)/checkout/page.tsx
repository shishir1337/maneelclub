import { getMerchantNumbers, getShippingRates } from "@/lib/settings";
import CheckoutClient from "./checkout-client";

export default async function CheckoutPage() {
  const [merchantNumbers, shippingRates] = await Promise.all([
    getMerchantNumbers(),
    getShippingRates(),
  ]);

  return (
    <CheckoutClient
      merchantNumbers={merchantNumbers}
      shippingRates={shippingRates}
    />
  );
}
