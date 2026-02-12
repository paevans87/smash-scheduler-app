import { fetchProPrices } from "@/lib/stripe-prices";
import type { StripePriceInfo } from "@/lib/stripe-prices";
import PricingContent from "./pricing-content";

export default async function PricingPage() {
  let proPrices: StripePriceInfo[] = [];
  let stripeFetchError = false;

  try {
    proPrices = await fetchProPrices();
  } catch {
    stripeFetchError = true;
  }

  return (
    <PricingContent proPrices={proPrices} stripeFetchError={stripeFetchError} />
  );
}
