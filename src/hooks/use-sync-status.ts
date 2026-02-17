"use client";

import { useState, useEffect } from "react";
import { getPendingCount } from "@/lib/db/sync";

export type SyncStatus = {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
};

export function useSyncStatus(): SyncStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Track online/offline
  useEffect(() => {
    function onOnline() {
      setIsOnline(true);
      setIsSyncing(true);
      // Give the background sync a moment to start, then update count
      setTimeout(() => setIsSyncing(false), 3000);
    }
    function onOffline() {
      setIsOnline(false);
      setIsSyncing(false);
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Poll pending count every 5 s
  useEffect(() => {
    async function refresh() {
      const count = await getPendingCount();
      setPendingCount(count);
    }

    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  return { isOnline, pendingCount, isSyncing };
}
