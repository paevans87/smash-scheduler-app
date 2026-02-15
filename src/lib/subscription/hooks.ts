import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type PlanType = "free" | "pro";

export type SubscriptionInfo = {
  planType: PlanType;
  status: "active" | "trialling" | "inactive" | "cancelled";
};

export function useClubSubscription(clubId: string | null) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!clubId) {
      setIsLoading(false);
      return;
    }

    async function fetchSubscription() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan_type, status")
        .eq("club_id", clubId)
        .in("status", ["active", "trialling"])
        .limit(1)
        .single();

      if (error || !data) {
        setSubscription(null);
      } else {
        setSubscription({
          planType: data.plan_type as PlanType,
          status: data.status as SubscriptionInfo["status"],
        });
      }
      setIsLoading(false);
    }

    fetchSubscription();
  }, [clubId]);

  return { subscription, isLoading };
}

export function isProPlan(planType: PlanType | undefined | null): boolean {
  return planType === "pro";
}

export function isFreePlan(planType: PlanType | undefined | null): boolean {
  return planType === "free" || !planType;
}
