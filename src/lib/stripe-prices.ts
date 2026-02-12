import "server-only";
import type Stripe from "stripe";
import { getStripe } from "./stripe";

export type StripePriceInfo = {
  id: string;
  unitAmount: number;
  currency: string;
  interval: "month" | "year";
};

export async function fetchProPrices(): Promise<StripePriceInfo[]> {
  const { data } = await getStripe().prices.list({
    product: process.env.STRIPE_PRO_PRODUCT_ID!,
    active: true,
    type: "recurring",
    expand: [],
  });

  return data
    .filter(
      (price): price is Stripe.Price & { recurring: Stripe.Price.Recurring } =>
        price.recurring !== null && price.unit_amount !== null
    )
    .map((price) => ({
      id: price.id,
      unitAmount: price.unit_amount!,
      currency: price.currency,
      interval: price.recurring.interval as "month" | "year",
    }))
    .sort((a, b) => (a.interval === "month" ? -1 : 1));
}
