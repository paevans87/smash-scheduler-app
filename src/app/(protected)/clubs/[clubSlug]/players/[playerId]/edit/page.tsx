import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerForm } from "@/components/player-form";
import { BlacklistManager } from "@/components/blacklist-manager";

type EditPlayerPageProps = {
  params: Promise<{ clubSlug: string; playerId: string }>;
};

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const { clubSlug, playerId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  const [{ data: player }, { data: blacklists }, { data: otherPlayers }] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, skill_level, gender, play_style_preference")
      .eq("id", playerId)
      .eq("club_id", club.id)
      .single(),
    supabase
      .from("player_blacklists")
      .select("id, blacklisted_player_id, blacklist_type, blacklisted:blacklisted_player_id(name)")
      .eq("player_id", playerId),
    supabase
      .from("players")
      .select("id, name")
      .eq("club_id", club.id)
      .neq("id", playerId)
      .order("name"),
  ]);

  if (!player) {
    redirect(`/clubs/${clubSlug}/players`);
  }

  const partnerBlacklist = (blacklists ?? [])
    .filter((b) => b.blacklist_type === 0)
    .map((b) => ({
      id: b.id,
      blacklisted_player_id: b.blacklisted_player_id,
      blacklisted_player_name: (b.blacklisted as unknown as { name: string })?.name ?? "Unknown",
    }));

  const opponentBlacklist = (blacklists ?? [])
    .filter((b) => b.blacklist_type === 1)
    .map((b) => ({
      id: b.id,
      blacklisted_player_id: b.blacklisted_player_id,
      blacklisted_player_name: (b.blacklisted as unknown as { name: string })?.name ?? "Unknown",
    }));

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-3xl font-bold">Edit Player</h1>
      <PlayerForm clubId={club.id} clubSlug={clubSlug} player={player} />
      <BlacklistManager
        playerId={player.id}
        partnerBlacklist={partnerBlacklist}
        opponentBlacklist={opponentBlacklist}
        otherPlayers={otherPlayers ?? []}
      />
    </div>
  );
}
