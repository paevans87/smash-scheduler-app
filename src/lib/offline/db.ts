import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface SmashSchedulerDB extends DBSchema {
  sessions: {
    key: string;
    value: {
      id: string;
      club_id: string;
      slug: string;
      scheduled_date_time: string;
      court_count: number;
      state: number;
    };
    indexes: { "by-club": string };
  };
  session_players: {
    key: string;
    value: {
      session_id: string;
      player_id: string;
      is_active: boolean;
    };
    indexes: { "by-session": string };
  };
  players: {
    key: string;
    value: {
      id: string;
      club_id: string;
      name: string;
      skill_level: number;
      gender: number;
      play_style_preference: number;
    };
    indexes: { "by-club": string };
  };
  matches: {
    key: string;
    value: {
      id: string;
      session_id: string;
      court_number: number;
      state: number;
      team1_score: number | null;
      team2_score: number | null;
    };
    indexes: { "by-session": string };
  };
  match_players: {
    key: string;
    value: {
      match_id: string;
      player_id: string;
      team_number: number;
    };
    indexes: { "by-match": string };
  };
  pending_changes: {
    key: number;
    value: {
      id?: number;
      table: string;
      operation: "insert" | "update" | "delete";
      payload: Record<string, unknown>;
      created_at: string;
    };
    indexes: {};
  };
}

let dbPromise: Promise<IDBPDatabase<SmashSchedulerDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<SmashSchedulerDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmashSchedulerDB>("SmashSchedulerDB", 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const sessionsStore = db.createObjectStore("sessions", {
            keyPath: "id",
          });
          sessionsStore.createIndex("by-club", "club_id");

          const sessionPlayersStore = db.createObjectStore("session_players", {
            keyPath: ["session_id", "player_id"],
          });
          sessionPlayersStore.createIndex("by-session", "session_id");

          const playersStore = db.createObjectStore("players", {
            keyPath: "id",
          });
          playersStore.createIndex("by-club", "club_id");

          const matchesStore = db.createObjectStore("matches", {
            keyPath: "id",
          });
          matchesStore.createIndex("by-session", "session_id");

          const matchPlayersStore = db.createObjectStore("match_players", {
            keyPath: ["match_id", "player_id"],
          });
          matchPlayersStore.createIndex("by-match", "match_id");

          db.createObjectStore("pending_changes", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      },
    });
  }
  return dbPromise;
}

export type { SmashSchedulerDB };
