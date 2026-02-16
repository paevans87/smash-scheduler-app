import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LapsedContent from "./lapsed-content";

type LapsedPageProps = {
  searchParams: Promise<{ club?: string }>;
};

export default async function SubscriptionLapsedPage({
  searchParams,
}: LapsedPageProps) {
  const { club: clubSlug } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!clubSlug) {
    redirect("/clubs");
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/clubs");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan_type, stripe_customer_id")
    .eq("club_id", club.id)
    .single();

  if (!subscription) {
    redirect("/pricing");
  }

  // If subscription is active/trialling, they don't belong here
  if (
    subscription.status === "active" ||
    subscription.status === "trialling"
  ) {
    redirect(`/clubs/${clubSlug}`);
  }

  // If it's already free, they don't belong here either
  if (subscription.plan_type === "free") {
    redirect(`/clubs/${clubSlug}`);
  }

  const { count: playerCount } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("club_id", club.id);

  return (
    <LapsedContent
      clubId={club.id}
      clubSlug={club.slug}
      clubName={club.name}
      status={subscription.status as "cancelled" | "expired"}
      playerCount={playerCount ?? 0}
      hasStripeCustomer={!!subscription.stripe_customer_id}
    />
  );
}
