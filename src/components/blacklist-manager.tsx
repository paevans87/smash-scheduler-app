"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

type BlacklistEntry = {
  id: string;
  blacklisted_player_id: string;
  blacklisted_player_name: string;
};

type OtherPlayer = {
  id: string;
  name: string;
};

type BlacklistManagerProps = {
  playerId: string;
  partnerBlacklist: BlacklistEntry[];
  opponentBlacklist: BlacklistEntry[];
  otherPlayers: OtherPlayer[];
};

function BlacklistSection({
  title,
  blacklistType,
  playerId,
  entries,
  otherPlayers,
}: {
  title: string;
  blacklistType: number;
  playerId: string;
  entries: BlacklistEntry[];
  otherPlayers: OtherPlayer[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const blacklistedIds = new Set(entries.map((e) => e.blacklisted_player_id));
  const available = otherPlayers.filter((p) => !blacklistedIds.has(p.id));

  async function handleAdd(blacklistedPlayerId: string) {
    setAdding(true);
    const supabase = createClient();
    await supabase.from("player_blacklists").insert({
      player_id: playerId,
      blacklisted_player_id: blacklistedPlayerId,
      blacklist_type: blacklistType,
    });
    setAdding(false);
    router.refresh();
  }

  async function handleRemove(entryId: string) {
    const supabase = createClient();
    await supabase.from("player_blacklists").delete().eq("id", entryId);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>

      {entries.length === 0 && (
        <p className="text-sm text-muted-foreground">None</p>
      )}

      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span>{entry.blacklisted_player_name}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={() => handleRemove(entry.id)}
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      {available.length > 0 && (
        <Select onValueChange={handleAdd} disabled={adding}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Add player to blacklist..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function BlacklistManager({
  playerId,
  partnerBlacklist,
  opponentBlacklist,
  otherPlayers,
}: BlacklistManagerProps) {
  return (
    <div className="max-w-md space-y-6">
      <Separator />
      <h2 className="text-lg font-semibold">Blacklists</h2>

      <BlacklistSection
        title="Partner Blacklist"
        blacklistType={0}
        playerId={playerId}
        entries={partnerBlacklist}
        otherPlayers={otherPlayers}
      />

      <BlacklistSection
        title="Opponent Blacklist"
        blacklistType={1}
        playerId={playerId}
        entries={opponentBlacklist}
        otherPlayers={otherPlayers}
      />
    </div>
  );
}
