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
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  const [subscription, { count: playerCount }] = await Promise.all([
    getClubSubscription(club.id),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id),
  ]);

  return (
    <PlayerListClient
      clubId={club.id}
      clubSlug={clubSlug}
      planType={subscription?.planType ?? "free"}
      playerCount={playerCount ?? 0}
    />
  );
}
