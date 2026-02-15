"use client";

import { OnlineStatusProvider } from "@/lib/offline/online-status-provider";
import { OfflineIndicator } from "@/components/offline-indicator";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <OnlineStatusProvider>
      <OfflineIndicator />
      {children}
    </OnlineStatusProvider>
  );
}
