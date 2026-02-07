import { getMerchantNumbers, getShippingRates } from "@/lib/settings";
import { getCities } from "@/actions/cities";
import CheckoutClient from "./checkout-client";

export default async function CheckoutPage() {
  const [merchantNumbers, shippingRates, cities] = await Promise.all([
    getMerchantNumbers(),
    getShippingRates(),
    getCities(),
  ]);

  return (
    <CheckoutClient
      merchantNumbers={merchantNumbers}
      shippingRates={shippingRates}
      cities={cities}
    />
  );
}
