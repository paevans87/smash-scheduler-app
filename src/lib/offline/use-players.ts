"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "./online-status-provider";
import { getPlayersFromCache, syncClubData } from "./sync-service";

type Player = {
  id: string;
  club_id: string;
  first_name?: string;
  last_name?: string;
  name?: string; // derived for UI compatibility
  skill_level: number;
  gender: number;
  play_style_preference: number;
};

type UsePlayersResult = {
  players: Player[];
  isLoading: boolean;
  isStale: boolean;
  mutate: () => void;
};

export function usePlayers(clubId: string): UsePlayersResult {
  const { isOnline } = useOnlineStatus();
  const [players, setPlayers] = useState<Player[]>([]);
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
      try {
        if (isOnline) {
          const supabase = createClient();
          const { data } = await supabase
            .from("players")
            .select("id, club_id, first_name, last_name, name, skill_level, gender, play_style_preference")
            .eq("club_id", clubId)
            .order("name");

          if (!cancelled && data) {
            // Derive a stable UI name from first/last names when available
            const enriched = data.map((p: any) => ({
              ...p,
              name: p.first_name && p.last_name
                ? `${p.first_name} ${p.last_name}`
                : p.name,
            }));
            setPlayers(enriched);
            setIsStale(false);
            await syncClubData(supabase, clubId);
          }
        } else {
          const cached = await getPlayersFromCache(clubId);
          if (!cancelled) {
            // Cache may not include first/last; ensure name is derived when needed
            const enriched = cached.map((p: any) => ({
              ...p,
              name: p.first_name && p.last_name
                ? `${p.first_name} ${p.last_name}`
                : p.name,
            }));
            setPlayers(enriched);
            setIsStale(true);
          }
        }
      } catch (e) {
        // In case of fetch/cache error, ensure we don't stay in loading state indefinitely
        if (!cancelled) {
          setPlayers([]);
          setIsStale(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [clubId, isOnline, revalidateKey]);

  return { players, isLoading, isStale, mutate };
}
