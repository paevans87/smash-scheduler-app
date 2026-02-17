import { redirect } from "next/navigation";
import { fetchProPrices } from "@/lib/stripe-prices";
import type { StripePriceInfo } from "@/lib/stripe-prices";
import { createClient } from "@/lib/supabase/server";
import { getClubSubscriptions } from "@/lib/auth/gates";
import { canCreateClub } from "@/lib/subscription/restrictions";
import PricingContent from "./pricing-content";

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let proPrices: StripePriceInfo[] = [];
  let stripeFetchError = false;

  try {
    proPrices = await fetchProPrices();
  } catch {
    stripeFetchError = true;
  }

  const subscriptions = await getClubSubscriptions(user.id);
  const clubCount = subscriptions.length;
  const hasProPlan = subscriptions.some((s) => s.planType === "pro");
  const canCreateFreeClub = canCreateClub(clubCount, hasProPlan ? "pro" : "free");

  const { count: priorProCount } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("plan_type", "pro")
    .eq("created_by", user.id);

  const hasUsedTrial = (priorProCount ?? 0) > 0;

  return (
    <PricingContent
      proPrices={proPrices}
      stripeFetchError={stripeFetchError}
      canCreateFreeClub={canCreateFreeClub}
      canStartTrial={!hasUsedTrial}
    />
  );
}
