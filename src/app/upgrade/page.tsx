import { redirect } from "next/navigation";
import { fetchProPrices } from "@/lib/stripe-prices";
import type { StripePriceInfo } from "@/lib/stripe-prices";
import { createClient } from "@/lib/supabase/server";
import { getClubSubscription } from "@/lib/auth/gates";
import UpgradeContent from "./upgrade-content";

type UpgradePageProps = {
  searchParams: Promise<{ club?: string }>;
};

export default async function UpgradePage({ searchParams }: UpgradePageProps) {
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

  const subscription = await getClubSubscription(club.id);

  if (subscription?.planType === "pro") {
    redirect(`/clubs/${clubSlug}`);
  }

  let proPrices: StripePriceInfo[] = [];
  let stripeFetchError = false;

  try {
    proPrices = await fetchProPrices();
  } catch {
    stripeFetchError = true;
  }

  const monthlyPrice = proPrices.find((p) => p.interval === "month") ?? null;

  return (
    <UpgradeContent
      clubId={club.id}
      clubSlug={club.slug}
      clubName={club.name}
      monthlyPrice={monthlyPrice}
      stripeFetchError={stripeFetchError}
    />
  );
}
