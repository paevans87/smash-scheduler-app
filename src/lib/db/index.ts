import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// ─── Schema types ────────────────────────────────────────────────────────────

export type SyncOperation = "insert" | "update" | "delete" | "upsert";

export interface SyncQueueEntry {
  id?: number; // auto-increment
  table: string;
  operation: SyncOperation;
  data?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  createdAt: number;
}

interface SmashDB extends DBSchema {
  sessions: {
    key: string;
    value: {
      id: string;
      club_id: string;
      scheduled_date_time: string;
      court_count: number;
      state: number;
    };
  };
  session_players: {
    key: [string, string]; // [session_id, player_id]
    value: {
      session_id: string;
      player_id: string;
      is_active: boolean;
    };
  };
  session_court_labels: {
    key: [string, number]; // [session_id, court_number]
    value: {
      session_id: string;
      court_number: number;
      label: string;
    };
  };
  sync_queue: {
    key: number;
    value: SyncQueueEntry;
  };
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let dbPromise: Promise<IDBPDatabase<SmashDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<SmashDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SmashDB>("smash-scheduler", 1, {
      upgrade(db) {
        db.createObjectStore("sessions", { keyPath: "id" });
        db.createObjectStore("session_players", {
          keyPath: ["session_id", "player_id"],
        });
        db.createObjectStore("session_court_labels", {
          keyPath: ["session_id", "court_number"],
        });
        db.createObjectStore("sync_queue", {
          keyPath: "id",
          autoIncrement: true,
        });
      },
    });
  }
  return dbPromise;
}

// ─── Seed helpers (called on page mount while online) ────────────────────────

export async function seedSession(session: SmashDB["sessions"]["value"]) {
  const db = await getDb();
  await db.put("sessions", session);
}

export async function seedSessionPlayers(
  sessionId: string,
  players: Array<{ player_id: string; is_active: boolean }>
) {
  const db = await getDb();
  const tx = db.transaction("session_players", "readwrite");
  await Promise.all([
    ...players.map((p) =>
      tx.store.put({
        session_id: sessionId,
        player_id: p.player_id,
        is_active: p.is_active,
      })
    ),
    tx.done,
  ]);
}

export async function seedCourtLabels(
  sessionId: string,
  labels: Array<{ court_number: number; label: string }>
) {
  const db = await getDb();
  const tx = db.transaction("session_court_labels", "readwrite");
  await Promise.all([
    ...labels.map((l) =>
      tx.store.put({
        session_id: sessionId,
        court_number: l.court_number,
        label: l.label,
      })
    ),
    tx.done,
  ]);
}
