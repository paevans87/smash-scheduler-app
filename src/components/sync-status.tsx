"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/lib/offline/online-status-provider";
import { getPendingChangeCount } from "@/lib/offline/pending-changes";
import { syncPendingChanges } from "@/lib/offline/sync-reconciler";
import { createClient } from "@/lib/supabase/client";

export function SyncStatus() {
  const { isOnline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function checkPending() {
      const count = await getPendingChangeCount();
      setPendingCount(count);
    }

    checkPending();
    const interval = setInterval(checkPending, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isOnline || pendingCount === 0) return;

    let cancelled = false;

    async function sync() {
      setIsSyncing(true);
      const supabase = createClient();
      await syncPendingChanges(supabase);
      const count = await getPendingChangeCount();
      if (!cancelled) {
        setPendingCount(count);
        setIsSyncing(false);
      }
    }

    sync();

    return () => {
      cancelled = true;
    };
  }, [isOnline, pendingCount]);

  if (pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <RefreshCw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} />
      <span>
        {isSyncing
          ? "Syncing..."
          : `${pendingCount} pending`}
      </span>
    </div>
  );
}
