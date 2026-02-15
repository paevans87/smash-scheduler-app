"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "./online-status-provider";
import { getPlayersFromCache, syncClubData } from "./sync-service";

type Player = {
  id: string;
  club_id: string;
  name: string;
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

      if (isOnline) {
        const supabase = createClient();
        const { data } = await supabase
          .from("players")
          .select("id, club_id, name, skill_level, gender, play_style_preference")
          .eq("club_id", clubId)
          .order("name");

        if (!cancelled && data) {
          setPlayers(data);
          setIsStale(false);
          await syncClubData(supabase, clubId);
        }
      } else {
        const cached = await getPlayersFromCache(clubId);
        if (!cancelled) {
          setPlayers(cached);
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

  return { players, isLoading, isStale, mutate };
}
