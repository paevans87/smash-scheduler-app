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
    .select("id, game_type, skill_type, default_matchmaking_profile_id")
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

  const [
    { data: systemProfiles },
    { data: clubProfiles },
    { data: systemTiers },
    { data: clubTiers },
  ] = await Promise.all([
    supabase
      .from("match_making_profiles")
      .select(
        "id, name, weight_skill_balance, weight_time_off_court, weight_match_history, apply_gender_matching, gender_matching_mode, blacklist_mode"
      )
      .is("club_id", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("match_making_profiles")
      .select(
        "id, name, weight_skill_balance, weight_time_off_court, weight_match_history, apply_gender_matching, gender_matching_mode, blacklist_mode"
      )
      .eq("club_id", club.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("club_skill_tiers")
      .select("id, name, score")
      .is("club_id", null)
      .order("score", { ascending: true }),
    supabase
      .from("club_skill_tiers")
      .select("id, name, score")
      .eq("club_id", club.id)
      .order("score", { ascending: true }),
  ]);

  type MmProfile = {
    id: string;
    name: string;
    weight_skill_balance: number;
    weight_time_off_court: number;
    weight_match_history: number;
    apply_gender_matching: boolean;
    gender_matching_mode: number;
    blacklist_mode: number;
  };
  type SkillTier = { id: string; name: string; score: number };

  const matchmakingProfiles = [
    ...((systemProfiles as MmProfile[]) ?? []),
    ...((clubProfiles as MmProfile[]) ?? []),
  ];

  const skillTiers = [
    ...((systemTiers as SkillTier[]) ?? []),
    ...((clubTiers as SkillTier[]) ?? []),
  ];

  const { data: sessionPlayersRaw } = await supabase
    .from("session_players")
    .select("player_id, is_active")
    .eq("session_id", sessionId);

  const playerIds = sessionPlayersRaw?.map((sp) => sp.player_id) ?? [];

  let playerDetails: Array<{
    id: string;
    name: string | null;
    gender: number;
    numerical_skill_level: number | null;
    skill_tier_id: string | null;
    play_style_preference: number;
  }> = [];
  if (playerIds.length > 0) {
    const { data } = await supabase
      .from("players")
      .select("id, name, gender, numerical_skill_level, skill_tier_id, play_style_preference")
      .in("id", playerIds);
    playerDetails = data ?? [];
  }

  let playerBlacklists: Array<{
    player_id: string;
    blacklisted_player_id: string;
    blacklist_type: number;
  }> = [];
  if (playerIds.length > 0) {
    const { data } = await supabase
      .from("player_blacklists")
      .select("player_id, blacklisted_player_id, blacklist_type")
      .in("player_id", playerIds);
    playerBlacklists = data ?? [];
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

  // Load all matches for this session (all states for stats)
  const { data: matchesRaw } = await supabase
    .from("matches")
    .select(
      "id, court_number, state, was_automated, started_at, completed_at, team1_score, team2_score, winning_team"
    )
    .eq("session_id", sessionId);

  const matchIds = matchesRaw?.map((m) => m.id) ?? [];

  let matchPlayersRaw: Array<{
    match_id: string;
    player_id: string;
    team_number: number;
  }> = [];
  if (matchIds.length > 0) {
    const { data } = await supabase
      .from("match_players")
      .select("match_id, player_id, team_number")
      .in("match_id", matchIds);
    matchPlayersRaw = data ?? [];
  }

  const matches = (matchesRaw ?? []).map((m) => ({
    id: m.id,
    court_number: m.court_number,
    state: m.state,
    was_automated: m.was_automated,
    started_at: m.started_at as string | null,
    completed_at: m.completed_at as string | null,
    team1_score: m.team1_score as number | null,
    team2_score: m.team2_score as number | null,
    winning_team: m.winning_team as number | null,
    players: matchPlayersRaw.filter((mp) => mp.match_id === m.id),
  }));

  return (
    <ActiveSessionClient
      sessionId={sessionId}
      clubSlug={clubSlug}
      clubId={club.id}
      gameType={club.game_type}
      skillType={club.skill_type}
      skillTiers={skillTiers}
      session={session}
      sessionPlayers={sessionPlayers}
      courtLabels={courtLabels ?? []}
      matches={matches}
      matchmakingProfiles={matchmakingProfiles}
      defaultProfileId={club.default_matchmaking_profile_id ?? null}
      playerBlacklists={playerBlacklists}
    />
  );
}
