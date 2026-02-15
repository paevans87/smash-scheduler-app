import { getDb } from "./db";

type PendingChange = {
  id?: number;
  table: string;
  operation: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  created_at: string;
};

export async function enqueuePendingChange(
  change: Omit<PendingChange, "id" | "created_at">
): Promise<void> {
  const db = await getDb();
  await db.add("pending_changes", {
    ...change,
    created_at: new Date().toISOString(),
  });
}

export async function getPendingChanges(): Promise<PendingChange[]> {
  const db = await getDb();
  return db.getAll("pending_changes");
}

export async function removePendingChange(id: number): Promise<void> {
  const db = await getDb();
  await db.delete("pending_changes", id);
}

export async function getPendingChangeCount(): Promise<number> {
  const db = await getDb();
  return db.count("pending_changes");
}
