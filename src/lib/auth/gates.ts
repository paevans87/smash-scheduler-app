import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PlanType } from "@/lib/subscription/hooks";

export type ClubSubscription = {
  clubId: string;
  planType: PlanType;
  status: "active" | "trialling";
};

export async function checkAssociationGate(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("user_id", user.id);

  const clubIds = memberships?.map((m) => m.club_id) ?? [];

  if (clubIds.length === 0) {
    redirect("/onboarding");
  }

  return clubIds;
}

export async function checkSubscriptionGate(clubIds: string[]): Promise<void> {
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id")
    .in("club_id", clubIds)
    .in("status", ["active", "trialling"]);

  if (!subscriptions || subscriptions.length === 0) {
    redirect("/pricing");
  }
}

export async function getClubSubscriptions(userId: string): Promise<ClubSubscription[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("user_id", userId);

  const clubIds = memberships?.map((m) => m.club_id) ?? [];

  if (clubIds.length === 0) {
    return [];
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("club_id, plan_type, status")
    .in("club_id", clubIds)
    .in("status", ["active", "trialling"]);

  return (subscriptions ?? []).map((s) => ({
    clubId: s.club_id,
    planType: s.plan_type as PlanType,
    status: s.status as "active" | "trialling",
  }));
}

export async function getClubSubscription(clubId: string): Promise<ClubSubscription | null> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("club_id, plan_type, status")
    .eq("club_id", clubId)
    .in("status", ["active", "trialling"])
    .limit(1)
    .single();

  if (!subscription) {
    return null;
  }

  return {
    clubId: subscription.club_id,
    planType: subscription.plan_type as PlanType,
    status: subscription.status as "active" | "trialling",
  };
}
