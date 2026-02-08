import { getMerchantNumbers, getShippingRates, getFreeShippingMinimum } from "@/lib/settings";
import { getCities } from "@/actions/cities";
import CheckoutClient from "./checkout-client";

export default async function CheckoutPage() {
  const [merchantNumbers, shippingRates, cities, freeShippingMinimum] = await Promise.all([
    getMerchantNumbers(),
    getShippingRates(),
    getCities(),
    getFreeShippingMinimum(),
  ]);

  return (
    <CheckoutClient
      merchantNumbers={merchantNumbers}
      shippingRates={shippingRates}
      cities={cities}
      freeShippingMinimum={freeShippingMinimum}
    />
  );
}
