import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DraftSessionClient } from "./draft-session-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DraftSessionPageProps = {
  params: Promise<{ clubSlug: string; sessionId: string }>;
};

export default async function DraftSessionPage({
  params,
}: DraftSessionPageProps) {
  const { clubSlug, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, game_type, skill_type")
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

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("club_id", club.id)
    .eq("state", 0)
    .single();

  if (!session) {
    redirect(`/clubs/${clubSlug}/sessions`);
  }

  const { data: availablePlayers } = await supabase
    .from("players")
    .select("id, name, numerical_skill_level, skill_tier_id, gender, skill_tier:club_skill_tiers(name)")
    .eq("club_id", club.id);

  const { data: sessionPlayersRaw } = await supabase
    .from("session_players")
    .select("player_id, is_active")
    .eq("session_id", sessionId);

  const { data: courtLabels } = await supabase
    .from("session_court_labels")
    .select("court_number, label")
    .eq("session_id", sessionId);

  const playerIds = sessionPlayersRaw?.map((sp) => sp.player_id) || [];

  let sessionPlayerDetails: Array<{ id: string; name: string; numerical_skill_level: number | null; skill_tier_id: string | null; skill_tier: { name: string } | null; gender: number }> = [];
  if (playerIds.length > 0) {
    const { data: playersData } = await supabase
      .from("players")
      .select("id, name, numerical_skill_level, skill_tier_id, gender, skill_tier:club_skill_tiers(name)")
      .in("id", playerIds);
    sessionPlayerDetails = (playersData || []).map((p) => ({
      ...p,
      skill_tier: p.skill_tier as unknown as { name: string } | null,
    }));
  }

  // Normalize skill_tier from Supabase join (may be array or object)
  const normalizedAvailablePlayers = (availablePlayers || []).map((p) => ({
    ...p,
    skill_tier: Array.isArray(p.skill_tier) ? (p.skill_tier[0] ?? null) : (p.skill_tier as { name: string } | null),
  }));

  const sessionPlayers = (sessionPlayersRaw || []).map((sp) => {
    const player = sessionPlayerDetails.find((p) => p.id === sp.player_id);
    return {
      player_id: sp.player_id,
      is_active: sp.is_active,
      players: player,
    };
  });

  return (
    <DraftSessionClient
      sessionId={sessionId}
      clubSlug={clubSlug}
      gameType={club.game_type}
      skillType={club.skill_type}
      session={session}
      availablePlayers={normalizedAvailablePlayers}
      sessionPlayers={sessionPlayers}
      courtLabels={courtLabels || []}
    />
  );
}
