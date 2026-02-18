"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { startBackgroundSync } from "@/lib/db/sync";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = createClient();
    const cleanup = startBackgroundSync(supabase);
    return cleanup;
  }, []);

  return <>{children}</>;
}
