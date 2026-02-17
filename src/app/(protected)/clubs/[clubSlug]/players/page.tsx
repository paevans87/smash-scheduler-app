import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerListClient } from "@/components/player-list-client";
import { getClubSubscription } from "@/lib/auth/gates";

type PlayersPageProps = {
  params: Promise<{ clubSlug: string }>;
};

export default async function PlayersPage({ params }: PlayersPageProps) {
  const { clubSlug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, skill_type")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  const [subscription, { count: playerCount }, { data: clubTiers }, { data: defaultTiers }] = await Promise.all([
    getClubSubscription(club.id),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id),
    supabase
      .from("club_skill_tiers")
      .select("*")
      .eq("club_id", club.id)
      .order("display_order", { ascending: true }),
    supabase
      .from("club_skill_tiers")
      .select("*")
      .is("club_id", null)
      .order("display_order", { ascending: true }),
  ]);

  const tiers = (clubTiers && clubTiers.length > 0) ? clubTiers : (defaultTiers ?? []);

  return (
    <PlayerListClient
      clubId={club.id}
      clubSlug={clubSlug}
      planType={subscription?.planType ?? "free"}
      playerCount={playerCount ?? 0}
      skillType={club.skill_type}
      tiers={tiers}
    />
  );
}
