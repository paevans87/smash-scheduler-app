"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type AvailablePlayer = {
  id: string;
  name: string;
  gender: number;
  numerical_skill_level: number | null;
  skill_tier_id: string | null;
  play_style_preference: number;
};

type AddPlayerDialogProps = {
  open: boolean;
  onClose: () => void;
  clubId: string;
  existingPlayerIds: string[];
  skillType: number; // 0=numerical, 1=tier
  skillTiers: Array<{ id: string; name: string; score: number }>;
  onAdd: (player: AvailablePlayer) => void;
};

const genderColours: Record<number, string> = {
  0: "var(--smash-gender-male)",
  1: "var(--smash-gender-female)",
};

export function AddPlayerDialog({
  open,
  onClose,
  clubId,
  existingPlayerIds,
  skillType,
  skillTiers,
  onAdd,
}: AddPlayerDialogProps) {
  const supabase = createClient();
  const [players, setPlayers] = useState<AvailablePlayer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const tierNameMap = new Map<string, string>(skillTiers.map((t) => [t.id, t.name]));

  // Fetch available players whenever the dialog opens
  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    setLoading(true);
    supabase
      .from("players")
      .select(
        "id, name, gender, numerical_skill_level, skill_tier_id, play_style_preference"
      )
      .eq("club_id", clubId)
      .then(({ data }) => {
        const existing = new Set(existingPlayerIds);
        setPlayers((data ?? []).filter((p) => !existing.has(p.id)));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clubId]);

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  function getSkillText(player: AvailablePlayer): string {
    if (skillType === 0) {
      return player.numerical_skill_level != null
        ? String(player.numerical_skill_level)
        : "?";
    }
    return player.skill_tier_id
      ? (tierNameMap.get(player.skill_tier_id) ?? "?")
      : "?";
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Player to Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Loading…
              </p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {players.length === 0
                  ? "All club players are already in the session."
                  : "No players match your search."}
              </p>
            ) : (
              filtered.map((player) => (
                <button
                  key={player.id}
                  className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-left hover:bg-muted transition-colors"
                  onClick={() => {
                    onAdd(player);
                    onClose();
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        genderColours[player.gender] ?? "transparent",
                    }}
                  />
                  <span className="flex-1 text-sm font-medium">
                    {player.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getSkillText(player)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
