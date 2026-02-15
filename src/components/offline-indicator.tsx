"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/lib/offline/online-status-provider";

export function OfflineIndicator() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2 bg-destructive px-4 py-2 text-sm text-destructive-foreground">
      <WifiOff className="size-4 shrink-0" />
      <span>You are offline. Changes will sync when reconnected.</span>
    </div>
  );
}
