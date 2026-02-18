"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type BenchPlayer = {
  player_id: string;
  player?: {
    name: string | null;
    gender: number;
  };
};

type CourtLabel = {
  court_number: number;
  label: string;
};

type ManualMatchDialogProps = {
  open: boolean;
  onClose: () => void;
  mode: "manual" | "draft";
  benchPlayers: BenchPlayer[];
  playersPerMatch: number; // 2 for singles, 4 for doubles
  availableCourts: number[];
  courtLabels: CourtLabel[];
  onConfirm: (
    players: { player_id: string; team_number: number }[],
    courtNumber: number
  ) => void;
};

const genderColours: Record<number, string> = {
  0: "var(--smash-gender-male)",
  1: "var(--smash-gender-female)",
};

function getCourtName(num: number, labels: CourtLabel[]): string {
  return labels.find((l) => l.court_number === num)?.label ?? `Court ${num}`;
}

export function ManualMatchDialog({
  open,
  onClose,
  mode,
  benchPlayers,
  playersPerMatch,
  availableCourts,
  courtLabels,
  onConfirm,
}: ManualMatchDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);

  // Reset state each time the dialog opens so court selection reflects the
  // current availableCourts (which may have changed since the last match).
  useEffect(() => {
    if (!open) return;
    setSelectedIds([]);
    setSelectedCourt(availableCourts.length === 1 ? availableCourts[0] : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const playersPerTeam = playersPerMatch / 2;
  const isFull = selectedIds.length === playersPerMatch;
  const canConfirm =
    isFull && (mode === "draft" || selectedCourt !== null);

  const team1 = selectedIds.slice(0, playersPerTeam);
  const team2 = selectedIds.slice(playersPerTeam, playersPerMatch);

  function handleTogglePlayer(playerId: string) {
    if (selectedIds.includes(playerId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== playerId));
    } else if (!isFull) {
      setSelectedIds((prev) => [...prev, playerId]);
    }
  }

  function handleConfirm() {
    if (!canConfirm) return;
    const players = [
      ...team1.map((id) => ({ player_id: id, team_number: 1 as const })),
      ...team2.map((id) => ({ player_id: id, team_number: 2 as const })),
    ];
    onConfirm(players, mode === "draft" ? 0 : selectedCourt!);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      onClose();
    }
  }

  function getPlayer(id: string) {
    return benchPlayers.find((bp) => bp.player_id === id);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "draft" ? "Draft Match" : "Manual Match"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Court selection — manual mode only */}
          {mode === "manual" && availableCourts.length > 1 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Select Court</p>
              <div className="flex flex-wrap gap-2">
                {availableCourts.map((court) => (
                  <Button
                    key={court}
                    size="sm"
                    variant={selectedCourt === court ? "default" : "outline"}
                    onClick={() => setSelectedCourt(court)}
                  >
                    {getCourtName(court, courtLabels)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Team preview */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Team 1", ids: team1 },
              { label: "Team 2", ids: team2 },
            ].map(({ label, ids }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {label}
                </p>
                <div className="space-y-1">
                  {Array.from({ length: playersPerTeam }).map((_, i) => {
                    const playerId = ids[i];
                    const bp = playerId ? getPlayer(playerId) : undefined;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm ${
                          playerId ? "cursor-pointer hover:bg-muted" : "border-dashed"
                        }`}
                        onClick={() => playerId && handleTogglePlayer(playerId)}
                      >
                        {playerId && bp ? (
                          <>
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor:
                                  genderColours[bp.player?.gender ?? 2],
                              }}
                            />
                            <span className="truncate">
                              {bp.player?.name ?? "Unknown"}
                            </span>
                            <X className="h-3 w-3 ml-auto text-muted-foreground shrink-0" />
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            Empty slot
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Bench players */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Bench</p>
              <Badge variant="secondary" className="text-xs">
                {selectedIds.length}/{playersPerMatch} selected
              </Badge>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {benchPlayers
                .filter((bp) => !selectedIds.includes(bp.player_id))
                .map((bp) => (
                  <button
                    key={bp.player_id}
                    type="button"
                    disabled={isFull}
                    onClick={() => handleTogglePlayer(bp.player_id)}
                    className="w-full flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          genderColours[bp.player?.gender ?? 2],
                      }}
                    />
                    <span className="truncate">
                      {bp.player?.name ?? "Unknown"}
                    </span>
                  </button>
                ))}
              {benchPlayers.filter((bp) => !selectedIds.includes(bp.player_id))
                .length === 0 && (
                <p className="text-sm text-muted-foreground py-2 text-center">
                  All bench players selected
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {mode === "draft" ? "Add to Draft" : "Start Match"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
