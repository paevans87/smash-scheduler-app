"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/offline/online-status-provider";
import { getDb } from "@/lib/offline/db";
import { PlayerForm } from "@/components/player-form";
import { BlacklistManager } from "@/components/blacklist-manager";

type Player = {
  id: string;
  name: string;
  skill_level: number;
  gender: number;
  play_style_preference: number;
};

type BlacklistEntry = {
  id: string;
  blacklisted_player_id: string;
  blacklisted_player_name: string;
};

type PlayerEditClientProps = {
  clubId: string;
  clubSlug: string;
  playerId: string;
};

export function PlayerEditClient({ clubId, clubSlug, playerId }: PlayerEditClientProps) {
  const { isOnline } = useOnlineStatus();
  const [player, setPlayer] = useState<Player | null>(null);
  const [partnerBlacklist, setPartnerBlacklist] = useState<BlacklistEntry[]>([]);
  const [opponentBlacklist, setOpponentBlacklist] = useState<BlacklistEntry[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      if (isOnline) {
        const supabase = createClient();
        const [{ data: playerData }, { data: blacklists }, { data: others }] = await Promise.all([
          supabase
            .from("players")
            .select("id, name, skill_level, gender, play_style_preference")
            .eq("id", playerId)
            .eq("club_id", clubId)
            .single(),
          supabase
            .from("player_blacklists")
            .select("id, blacklisted_player_id, blacklist_type, blacklisted:blacklisted_player_id(name)")
            .eq("player_id", playerId),
          supabase
            .from("players")
            .select("id, name")
            .eq("club_id", clubId)
            .neq("id", playerId)
            .order("name"),
        ]);

        if (cancelled) return;

        if (!playerData) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setPlayer(playerData);
        setOtherPlayers(others ?? []);
        setPartnerBlacklist(
          (blacklists ?? [])
            .filter((b) => b.blacklist_type === 0)
            .map((b) => ({
              id: b.id,
              blacklisted_player_id: b.blacklisted_player_id,
              blacklisted_player_name: (b.blacklisted as unknown as { name: string })?.name ?? "Unknown",
            }))
        );
        setOpponentBlacklist(
          (blacklists ?? [])
            .filter((b) => b.blacklist_type === 1)
            .map((b) => ({
              id: b.id,
              blacklisted_player_id: b.blacklisted_player_id,
              blacklisted_player_name: (b.blacklisted as unknown as { name: string })?.name ?? "Unknown",
            }))
        );
      } else {
        const db = await getDb();
        const cached = await db.get("players", playerId);

        if (cancelled) return;

        if (!cached || cached.club_id !== clubId) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setPlayer(cached);
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [clubId, playerId, isOnline]);

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-6">
        <h1 className="text-3xl font-bold">Edit Player</h1>
        <p className="text-muted-foreground">Loading player...</p>
      </div>
    );
  }

  if (notFound || !player) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-6">
        <h1 className="text-3xl font-bold">Edit Player</h1>
        <p className="text-muted-foreground">Player not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-3xl font-bold">Edit Player</h1>
      <PlayerForm clubId={clubId} clubSlug={clubSlug} player={player} />
      {isOnline ? (
        <BlacklistManager
          playerId={player.id}
          partnerBlacklist={partnerBlacklist}
          opponentBlacklist={opponentBlacklist}
          otherPlayers={otherPlayers}
        />
      ) : (
        <p className="text-sm text-muted-foreground italic">
          Blacklist management is unavailable offline.
        </p>
      )}
    </div>
  );
}
