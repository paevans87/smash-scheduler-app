"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { enqueuePendingChange } from "@/lib/offline/pending-changes";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/offline/online-status-provider";
import { PlayerForm } from "@/components/player-form";
import { BlacklistManager } from "@/components/blacklist-manager";
import { Button } from "@/components/ui/button";

type PlayerNewClientProps = {
  clubId: string;
  clubSlug: string;
};

const PLAYER_FORM_ID = "player-new-form";

export function PlayerNewClient({ clubId, clubSlug }: PlayerNewClientProps) {
  const { isOnline } = useOnlineStatus();
  const router = useRouter();
  const [otherPlayers, setOtherPlayers] = useState<{ id: string; name: string }[]>([]);
  const [pendingBlacklistChanges, setPendingBlacklistChanges] = useState<{
    adds: Array<{ id: string; type: number }>;
    removals: string[];
  }>({ adds: [], removals: [] });

  useEffect(() => {
    if (!isOnline) return;

    async function loadPlayers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("players")
        .select("id, name")
        .eq("club_id", clubId)
        .order("name");
      setOtherPlayers(data ?? []);
    }

    loadPlayers();
  }, [clubId, isOnline]);

  const handleSaveBlacklist = useCallback(async (savedPlayerId: string) => {
    const changes = pendingBlacklistChanges;
    if (changes.adds.length === 0) return;

    if (isOnline) {
      const supabase = createClient();
      for (const add of changes.adds) {
        await supabase.from("player_blacklists").insert({
          player_id: savedPlayerId,
          blacklisted_player_id: add.id,
          blacklist_type: add.type,
        });
      }
    } else {
      for (const add of changes.adds) {
        await enqueuePendingChange({
          table: "player_blacklists",
          operation: "insert",
          payload: { player_id: savedPlayerId, blacklisted_player_id: add.id, blacklist_type: add.type },
        } as any);
      }
    }

    setPendingBlacklistChanges({ adds: [], removals: [] });
  }, [pendingBlacklistChanges, isOnline]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-3xl font-bold">Add Player</h1>
      <PlayerForm
        clubId={clubId}
        clubSlug={clubSlug}
        onSave={handleSaveBlacklist}
        hideActions
        formId={PLAYER_FORM_ID}
      />
      {isOnline && otherPlayers.length > 0 && (
        <BlacklistManager
          partnerBlacklist={[]}
          opponentBlacklist={[]}
          otherPlayers={otherPlayers}
          onPendingChange={setPendingBlacklistChanges}
        />
      )}
      <div className="flex gap-3">
        <Button type="submit" form={PLAYER_FORM_ID}>Add Player</Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/clubs/${clubSlug}/players`)}>Cancel</Button>
      </div>
    </div>
  );
}
