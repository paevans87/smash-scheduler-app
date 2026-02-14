import type { SupabaseClient } from "@supabase/supabase-js";
import { getPendingChanges, removePendingChange } from "./pending-changes";

export async function syncPendingChanges(
  supabase: SupabaseClient
): Promise<{ synced: number; failed: number }> {
  const changes = await getPendingChanges();
  let synced = 0;
  let failed = 0;

  for (const change of changes) {
    try {
      if (change.operation === "insert") {
        const { error } = await supabase
          .from(change.table)
          .upsert(change.payload);
        if (error) throw error;
      } else if (change.operation === "update") {
        const { id, ...rest } = change.payload;
        const { error } = await supabase
          .from(change.table)
          .update(rest)
          .eq("id", id as string);
        if (error) throw error;
      } else if (change.operation === "delete") {
        // Handle tables with compound keys
        if (change.table === "session_players") {
          const { session_id, player_id } = change.payload;
          const { error } = await supabase
            .from(change.table)
            .delete()
            .eq("session_id", session_id as string)
            .eq("player_id", player_id as string);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from(change.table)
            .delete()
            .eq("id", change.payload.id as string);
          if (error) throw error;
        }
      }

      if (change.id !== undefined) {
        await removePendingChange(change.id);
      }
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
