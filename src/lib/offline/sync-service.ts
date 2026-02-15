import type { SupabaseClient } from "@supabase/supabase-js";
import { getDb } from "./db";

export async function syncClubData(
  supabase: SupabaseClient,
  clubId: string
): Promise<void> {
  const db = await getDb();

  const [
    { data: sessions },
    { data: players },
    { data: matches },
    { data: sessionPlayers },
    { data: matchPlayers },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("id, club_id, slug, scheduled_date_time, court_count, state")
      .eq("club_id", clubId),
    supabase
      .from("players")
      .select("id, club_id, name, skill_level, gender, play_style_preference")
      .eq("club_id", clubId),
    supabase
      .from("matches")
      .select("id, session_id, court_number, state, team1_score, team2_score")
      .in(
        "session_id",
        (
          await supabase
            .from("sessions")
            .select("id")
            .eq("club_id", clubId)
        ).data?.map((s) => s.id) ?? []
      ),
    supabase
      .from("session_players")
      .select("session_id, player_id, is_active")
      .in(
        "session_id",
        (
          await supabase
            .from("sessions")
            .select("id")
            .eq("club_id", clubId)
        ).data?.map((s) => s.id) ?? []
      ),
    supabase
      .from("match_players")
      .select("match_id, player_id, team_number")
      .in(
        "match_id",
        (
          await supabase
            .from("matches")
            .select("id, session_id")
            .in(
              "session_id",
              (
                await supabase
                  .from("sessions")
                  .select("id")
                  .eq("club_id", clubId)
              ).data?.map((s) => s.id) ?? []
            )
        ).data?.map((m) => m.id) ?? []
      ),
  ]);

  const tx = db.transaction(
    ["sessions", "players", "matches", "session_players", "match_players"],
    "readwrite"
  );

  if (sessions) {
    const store = tx.objectStore("sessions");
    for (const session of sessions) {
      await store.put(session);
    }
  }

  if (players) {
    const store = tx.objectStore("players");
    for (const player of players) {
      await store.put(player);
    }
  }

  if (matches) {
    const store = tx.objectStore("matches");
    for (const match of matches) {
      await store.put(match);
    }
  }

  if (sessionPlayers) {
    const store = tx.objectStore("session_players");
    for (const sp of sessionPlayers) {
      await store.put(sp);
    }
  }

  if (matchPlayers) {
    const store = tx.objectStore("match_players");
    for (const mp of matchPlayers) {
      await store.put(mp);
    }
  }

  await tx.done;
}

export async function getSessionsFromCache(clubId: string) {
  const db = await getDb();
  return db.getAllFromIndex("sessions", "by-club", clubId);
}

export async function getPlayersFromCache(clubId: string) {
  const db = await getDb();
  return db.getAllFromIndex("players", "by-club", clubId);
}

export async function clearPlayersCache(clubId: string) {
  const db = await getDb();
  const tx = db.transaction("players", "readwrite");
  const store = tx.objectStore("players");
  const index = store.index("by-club");
  let cursor = await index.openCursor(clubId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

export async function getMatchesFromCache(sessionId: string) {
  const db = await getDb();
  return db.getAllFromIndex("matches", "by-session", sessionId);
}

export async function getSessionPlayersFromCache(sessionId: string) {
  const db = await getDb();
  return db.getAllFromIndex("session_players", "by-session", sessionId);
}

export async function getSessionFromCache(sessionId: string) {
  const db = await getDb();
  return db.get("sessions", sessionId);
}

export async function cacheSession(session: {
  id: string;
  club_id?: string;
  slug?: string;
  scheduled_date_time?: string;
  court_count?: number;
  state?: number;
}) {
  const db = await getDb();
  const existing = await db.get("sessions", session.id);
  const merged = { ...existing, ...session };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.put("sessions", merged as any);
}

export async function cacheSessionPlayer(sessionPlayer: {
  session_id: string;
  player_id: string;
  is_active: boolean;
}) {
  const db = await getDb();
  await db.put("session_players", sessionPlayer);
}

export async function removeSessionPlayerFromCache(
  sessionId: string,
  playerId: string
) {
  const db = await getDb();
  await db.delete("session_players", [sessionId, playerId] as unknown as IDBKeyRange);
}
