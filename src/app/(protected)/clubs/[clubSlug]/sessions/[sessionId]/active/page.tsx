import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActiveSessionClient } from "./active-session-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ActiveSessionPageProps = {
  params: Promise<{ clubSlug: string; sessionId: string }>;
};

export default async function ActiveSessionPage({
  params,
}: ActiveSessionPageProps) {
  const { clubSlug, sessionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();
  if (!club) redirect("/clubs");

  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();
  if (!membership) redirect("/clubs");

  const { data: session } = await supabase
    .from("sessions")
    .select("id, scheduled_date_time, court_count, state")
    .eq("id", sessionId)
    .eq("club_id", club.id)
    .eq("state", 1)
    .single();
  if (!session) redirect(`/clubs/${clubSlug}/sessions`);

  const { data: sessionPlayersRaw } = await supabase
    .from("session_players")
    .select("player_id, is_active")
    .eq("session_id", sessionId);

  const playerIds = sessionPlayersRaw?.map((sp) => sp.player_id) ?? [];

  let playerDetails: Array<{ id: string; name: string | null; gender: number }> =
    [];
  if (playerIds.length > 0) {
    const { data } = await supabase
      .from("players")
      .select("id, name, gender")
      .in("id", playerIds);
    playerDetails = data ?? [];
  }

  const sessionPlayers = (sessionPlayersRaw ?? []).map((sp) => ({
    player_id: sp.player_id,
    is_active: sp.is_active,
    player: playerDetails.find((p) => p.id === sp.player_id),
  }));

  const { data: courtLabels } = await supabase
    .from("session_court_labels")
    .select("court_number, label")
    .eq("session_id", sessionId);

  return (
    <ActiveSessionClient
      sessionId={sessionId}
      clubSlug={clubSlug}
      session={session}
      sessionPlayers={sessionPlayers}
      courtLabels={courtLabels ?? []}
    />
  );
}
