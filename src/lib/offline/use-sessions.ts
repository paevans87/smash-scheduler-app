"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "./online-status-provider";
import { getSessionsFromCache, syncClubData } from "./sync-service";

type Session = {
  id: string;
  club_id: string;
  slug: string;
  scheduled_date_time: string;
  court_count: number;
  state: number;
};

type UseSessionsResult = {
  sessions: Session[];
  isLoading: boolean;
  isStale: boolean;
  mutate: () => void;
};

export function useSessions(clubId: string): UseSessionsResult {
  const { isOnline } = useOnlineStatus();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [revalidateKey, setRevalidateKey] = useState(0);

  const mutate = useCallback(() => {
    setRevalidateKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      if (isOnline) {
        const supabase = createClient();
        const { data } = await supabase
          .from("sessions")
          .select("id, club_id, slug, scheduled_date_time, court_count, state")
          .eq("club_id", clubId)
          .order("scheduled_date_time", { ascending: false });

        if (!cancelled && data) {
          setSessions(data);
          setIsStale(false);
          await syncClubData(supabase, clubId);
        }
      } else {
        const cached = await getSessionsFromCache(clubId);
        if (!cancelled) {
          setSessions(cached);
          setIsStale(true);
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [clubId, isOnline, revalidateKey]);

  return { sessions, isLoading, isStale, mutate };
}
