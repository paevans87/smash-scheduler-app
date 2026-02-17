import type { SupabaseClient } from "@supabase/supabase-js";
import { getDb, type SyncOperation } from "./index";

// ─── Enqueue ─────────────────────────────────────────────────────────────────

export async function enqueueMutation(
  table: string,
  operation: SyncOperation,
  data?: Record<string, unknown>,
  filter?: Record<string, unknown>
) {
  const db = await getDb();
  await db.add("sync_queue", { table, operation, data, filter, createdAt: Date.now() });
}

// ─── Process ─────────────────────────────────────────────────────────────────

export async function processQueue(supabase: SupabaseClient): Promise<void> {
  const db = await getDb();
  const items = await db.getAll("sync_queue");
  if (items.length === 0) return;

  // Process oldest first
  const sorted = items.sort((a, b) => a.createdAt - b.createdAt);

  for (const item of sorted) {
    try {
      let error: { message: string } | null = null;

      if (item.operation === "insert" && item.data) {
        ({ error } = await supabase.from(item.table).insert(item.data));
      } else if (item.operation === "upsert" && item.data) {
        ({ error } = await supabase.from(item.table).upsert(item.data));
      } else if (item.operation === "update" && item.data && item.filter) {
        let query = supabase.from(item.table).update(item.data);
        for (const [key, val] of Object.entries(item.filter)) {
          query = query.eq(key, val as string);
        }
        ({ error } = await query);
      } else if (item.operation === "delete" && item.filter) {
        let query = supabase.from(item.table).delete();
        for (const [key, val] of Object.entries(item.filter)) {
          query = query.eq(key, val as string);
        }
        ({ error } = await query);
      }

      if (!error && item.id !== undefined) {
        await db.delete("sync_queue", item.id);
      }
    } catch {
      // Leave in queue — will retry on next cycle
    }
  }
}

// ─── Count ───────────────────────────────────────────────────────────────────

export async function getPendingCount(): Promise<number> {
  const db = await getDb();
  return db.count("sync_queue");
}

// ─── Background sync ─────────────────────────────────────────────────────────

const SYNC_INTERVAL_MS = 30_000;

export function startBackgroundSync(supabase: SupabaseClient): () => void {
  async function trySync() {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      await processQueue(supabase);
    }
  }

  const interval = setInterval(trySync, SYNC_INTERVAL_MS);

  const onOnline = () => trySync();
  window.addEventListener("online", onOnline);

  return () => {
    clearInterval(interval);
    window.removeEventListener("online", onOnline);
  };
}
