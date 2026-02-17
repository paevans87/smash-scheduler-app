"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PlayerForm } from "@/components/player-form";
import type { SkillTier } from "@/components/player-form";
import { BlacklistManager } from "@/components/blacklist-manager";
import { Button } from "@/components/ui/button";

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  numerical_skill_level: number | null;
  skill_tier_id: string | null;
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
  playerSlug?: string;
  skillType: number;
  tiers: SkillTier[];
};

const PLAYER_FORM_ID = "player-edit-form";

export function PlayerEditClient({ clubId, clubSlug, playerId, skillType, tiers }: PlayerEditClientProps) {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [partnerBlacklist, setPartnerBlacklist] = useState<BlacklistEntry[]>([]);
  const [opponentBlacklist, setOpponentBlacklist] = useState<BlacklistEntry[]>([]);
  const [otherPlayers, setOtherPlayers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pendingBlacklistChanges, setPendingBlacklistChanges] = useState<{
    adds: Array<{ id: string; type: number }>;
    removals: string[];
  }>({ adds: [], removals: [] });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      const supabase = createClient();
      const [{ data: playerData }, { data: blacklists }, { data: others }] = await Promise.all([
        supabase
          .from("players")
          .select("id, first_name, last_name, name, numerical_skill_level, skill_tier_id, gender, play_style_preference")
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
      setPendingBlacklistChanges({ adds: [], removals: [] });

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [clubId, playerId]);

  const handleSaveBlacklist = useCallback(async (savedPlayerId: string) => {
    const changes = pendingBlacklistChanges;
    if (changes.adds.length === 0 && changes.removals.length === 0) return;

    const supabase = createClient();
    for (const add of changes.adds) {
      await supabase.from("player_blacklists").insert({
        player_id: savedPlayerId,
        blacklisted_player_id: add.id,
        blacklist_type: add.type,
      });
    }
    for (const rem of changes.removals) {
      await supabase.from("player_blacklists").delete().eq("id", rem);
    }

    setPendingBlacklistChanges({ adds: [], removals: [] });
  }, [pendingBlacklistChanges]);

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
      <PlayerForm
        clubId={clubId}
        clubSlug={clubSlug}
        skillType={skillType}
        tiers={tiers}
        player={player}
        onSave={handleSaveBlacklist}
        hideActions
        formId={PLAYER_FORM_ID}
      />
      <BlacklistManager
        partnerBlacklist={partnerBlacklist}
        opponentBlacklist={opponentBlacklist}
        otherPlayers={otherPlayers}
        onPendingChange={setPendingBlacklistChanges}
      />
      <div className="flex gap-3">
        <Button type="submit" form={PLAYER_FORM_ID}>Update Player</Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/clubs/${clubSlug}/players`)}>Cancel</Button>
      </div>
    </div>
  );
}
