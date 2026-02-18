import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MatchMakingProfileList } from "./match-making-profile-list";
import { ClubSettingsForm } from "./club-settings-form";
import { SkillMeasurementSection } from "./skill-measurement-section";
import { SubscriptionCard } from "./subscription-card";
import { DeleteClubSection } from "./delete-club-section";
import { getClubSubscription } from "@/lib/auth/gates";
import { canUseCustomMatchmakingProfiles, canUseCustomSkillTiers } from "@/lib/subscription/restrictions";
import { fetchProPrices } from "@/lib/stripe-prices";

type MatchMakingProfile = {
  id: string;
  club_id: string | null;
  name: string;
  weight_skill_balance: number;
  weight_time_off_court: number;
  weight_match_history: number;
  apply_gender_matching: boolean;
  gender_matching_mode: number;
  blacklist_mode: number;
};

type Club = {
  id: string;
  name: string;
  default_court_count: number;
  game_type: number;
  skill_type: number;
  default_matchmaking_profile_id: string | null;
};

type ClubManagementPageProps = {
  params: Promise<{ clubSlug: string }>;
};

export default async function ClubManagementPage({
  params,
}: ClubManagementPageProps) {
  const { clubSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, default_court_count, game_type, skill_type, default_matchmaking_profile_id")
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

  const [subscription, { data: clubProfiles }, { data: defaultProfiles }, { data: subRecord }, { count: playerCount }, { data: defaultTiers }, { data: clubTiers }] = await Promise.all([
    getClubSubscription(club.id),
    supabase
      .from("match_making_profiles")
      .select("*")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("match_making_profiles")
      .select("*")
      .is("club_id", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("subscriptions")
      .select("status, plan_type, current_period_end, stripe_subscription_id, cancel_at_period_end")
      .eq("club_id", club.id)
      .single(),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id),
    supabase
      .from("club_skill_tiers")
      .select("*")
      .is("club_id", null)
      .order("display_order", { ascending: true }),
    supabase
      .from("club_skill_tiers")
      .select("*")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
  ]);

  const profiles = [
    ...((defaultProfiles as MatchMakingProfile[]) ?? []),
    ...((clubProfiles as MatchMakingProfile[]) ?? []),
  ];

  const planType = subscription?.planType ?? "free";
  const canCreateCustomProfiles = canUseCustomMatchmakingProfiles(planType);
  const canCreateCustomTiers = canUseCustomSkillTiers(planType);

  let monthlyAmount: string | null = null;
  if (planType === "pro") {
    try {
      const prices = await fetchProPrices();
      const monthly = prices.find((p) => p.interval === "month");
      if (monthly) {
        monthlyAmount = new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: monthly.currency,
        }).format(monthly.unitAmount / 100);
      }
    } catch {
      // Price fetch failed — card will just omit the amount
    }
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Club Management</h1>
          <p className="text-muted-foreground">
            Manage your club settings and match making profiles
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Club Settings</CardTitle>
          <CardDescription>
            Update your club name, default courts, and game type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClubSettingsForm club={club as Club} clubSlug={clubSlug} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skill Measurement</CardTitle>
          <CardDescription>
            Choose how player skill levels are measured and displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkillMeasurementSection
            clubId={club.id}
            clubSlug={clubSlug}
            currentSkillType={club.skill_type}
            playerCount={playerCount ?? 0}
            defaultTiers={defaultTiers ?? []}
            clubTiers={clubTiers ?? []}
            canCreateCustomTiers={canCreateCustomTiers}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle>Match Making Profiles</CardTitle>
              <CardDescription>
                {canCreateCustomProfiles
                  ? "Create profiles with different weightings for match making"
                  : "View default profiles or upgrade to Pro for custom profiles"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {!canCreateCustomProfiles && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Crown className="size-4 text-amber-500" />
                  <span className="text-sm">Pro feature</span>
                </div>
              )}
              <Button asChild={canCreateCustomProfiles} disabled={!canCreateCustomProfiles}>
                {canCreateCustomProfiles ? (
                  <Link href={`/clubs/${clubSlug}/manage/profiles/new`}>
                    <Plus className="mr-2 size-4" />
                    New Profile
                  </Link>
                ) : (
                  <>
                    <Plus className="mr-2 size-4" />
                    New Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        {!canCreateCustomProfiles && (
          <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
            <Crown className="size-4 shrink-0 text-amber-500" />
            <p className="text-amber-800 dark:text-amber-200">
              Custom profiles are a Pro feature.{" "}
              <Link
                href={`/upgrade?club=${clubSlug}`}
                className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
              >
                Upgrade to create your own profiles
              </Link>
            </p>
          </div>
        )}
        <CardContent>
          <MatchMakingProfileList
            profiles={profiles}
            clubSlug={clubSlug}
            clubId={club.id}
            defaultProfileId={club.default_matchmaking_profile_id}
          />
        </CardContent>
      </Card>

      <SubscriptionCard
        clubId={club.id}
        clubSlug={clubSlug}
        planType={(subRecord?.plan_type as "free" | "pro") ?? planType}
        status={(subRecord?.status as "active" | "trialling" | "cancelled" | "expired") ?? "active"}
        currentPeriodEnd={subRecord?.current_period_end ?? null}
        monthlyAmount={monthlyAmount}
        hasStripeSubscription={!!subRecord?.stripe_subscription_id}
        cancelAtPeriodEnd={subRecord?.cancel_at_period_end ?? false}
      />

      <DeleteClubSection
        clubId={club.id}
        clubName={club.name}
        hasActiveSubscription={
          !!subRecord?.stripe_subscription_id &&
          (subRecord?.status === "active" || subRecord?.status === "trialling") &&
          !subRecord?.cancel_at_period_end
        }
      />
    </div>
  );
}
