"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, X, Zap, UserPlus } from "lucide-react";
import {
  type AlgorithmPlayer,
  type CompletedMatchRecord,
  type MatchCandidate,
  type ScoringWeights,
  type MatchConfig,
  generateMatches,
  findBestReplacement,
  scoreGroup,
  buildGroupCounts,
  buildLastMatchTimes,
} from "@/lib/matchmaking";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlayerDisplayInfo = {
  name: string;
  gender: number;
  skillText: string;
};

type CourtLabel = {
  court_number: number;
  label: string;
};

export type ConfirmedMatch = {
  courtNumber: number;
  players: { player_id: string; team_number: number }[];
};

type ProposalState = {
  courtNumber: number;
  courtName: string;
  slots: (string | null)[]; // ordered: first half = team 1, second half = team 2
  score: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialProposals: MatchCandidate[];
  allBenchPlayers: AlgorithmPlayer[];
  playerInfo: Map<string, PlayerDisplayInfo>;
  completedMatches: CompletedMatchRecord[];
  weights: ScoringWeights;
  playersPerMatch: number;
  selectedCourts: number[];
  courtLabels: CourtLabel[];
  config?: MatchConfig;
  mode?: "generate" | "draft"; // controls title and confirm button label
  onManualFallback?: () => void; // shown in the empty state so the user can skip to manual
  onConfirm: (matches: ConfirmedMatch[]) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const genderColours: Record<number, string> = {
  0: "var(--smash-gender-male)",
  1: "var(--smash-gender-female)",
};

function getCourtName(num: number, labels: CourtLabel[]): string {
  return labels.find((l) => l.court_number === num)?.label ?? `Court ${num}`;
}

function scoreLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

function scoreBadgeClass(score: number): string {
  if (score >= 70) return "bg-green-600 hover:bg-green-600 text-white";
  if (score >= 50) return "bg-yellow-500 hover:bg-yellow-500 text-white";
  return "bg-red-500 hover:bg-red-500 text-white";
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MatchPreviewDialog({
  open,
  onClose,
  initialProposals,
  allBenchPlayers,
  playerInfo,
  completedMatches,
  weights,
  playersPerMatch,
  selectedCourts,
  courtLabels,
  config,
  mode = "generate",
  onManualFallback,
  onConfirm,
}: Props) {
  const [proposals, setProposals] = useState<ProposalState[]>([]);
  const [picking, setPicking] = useState<{
    courtNumber: number;
    slotIndex: number;
  } | null>(null);

  // Copy proposals into local state on open
  useEffect(() => {
    if (!open) return;
    setProposals(
      initialProposals.map((c) => ({
        courtNumber: c.courtNumber,
        courtName: getCourtName(c.courtNumber, courtLabels),
        slots: [...c.playerIds],
        score: c.totalScore,
      }))
    );
    setPicking(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Fast player lookup for algorithm calls
  const playerMap = useMemo(() => {
    const m = new Map<string, AlgorithmPlayer>();
    for (const p of allBenchPlayers) m.set(p.id, p);
    return m;
  }, [allBenchPlayers]);

  // Pre-compute history data (stable for the lifetime of this dialog open)
  const groupCounts = useMemo(
    () => buildGroupCounts(completedMatches),
    [completedMatches]
  );
  const lastMatchTimes = useMemo(
    () => buildLastMatchTimes(completedMatches),
    [completedMatches]
  );

  // All player IDs currently occupying a slot across all proposals
  const usedPlayerIds = useMemo(() => {
    const s = new Set<string>();
    for (const p of proposals) {
      for (const id of p.slots) {
        if (id) s.add(id);
      }
    }
    return s;
  }, [proposals]);

  // Players available to add to any empty slot
  const availableToAdd = useMemo(
    () => allBenchPlayers.filter((p) => !usedPlayerIds.has(p.id)),
    [allBenchPlayers, usedPlayerIds]
  );

  // ─── Score helpers ─────────────────────────────────────────────────────────

  function recalcScore(slots: (string | null)[]): number {
    const filled = slots.filter(Boolean) as string[];
    if (filled.length < playersPerMatch) return 0;
    const group = filled
      .map((id) => playerMap.get(id))
      .filter(Boolean) as AlgorithmPlayer[];
    if (group.length < playersPerMatch) return 0;
    const now = Date.now();
    const maxWaitMs = allBenchPlayers.reduce((max, p) => {
      const last = lastMatchTimes.get(p.id);
      const waitMs = last != null ? now - last : 3_600_000;
      return Math.max(max, waitMs);
    }, 0);
    const { score } = scoreGroup(
      group,
      groupCounts,
      lastMatchTimes,
      weights,
      now,
      maxWaitMs,
      config
    );
    return score;
  }

  // ─── Slot actions ──────────────────────────────────────────────────────────

  function removePlayer(courtNumber: number, slotIndex: number) {
    setPicking(null);
    setProposals((prev) =>
      prev.map((p) => {
        if (p.courtNumber !== courtNumber) return p;
        const slots = [...p.slots];
        slots[slotIndex] = null;
        return { ...p, slots, score: recalcScore(slots) };
      })
    );
  }

  function fillBest(courtNumber: number, slotIndex: number) {
    const proposal = proposals.find((p) => p.courtNumber === courtNumber);
    if (!proposal) return;

    const fixedIds = proposal.slots.filter(Boolean) as string[];
    // Pool excludes players in OTHER courts' slots (but includes players in this court)
    const otherUsed = new Set<string>();
    for (const pr of proposals) {
      if (pr.courtNumber !== courtNumber) {
        for (const id of pr.slots) {
          if (id) otherUsed.add(id);
        }
      }
    }
    const pool = allBenchPlayers.filter((p) => !otherUsed.has(p.id));
    const bestId = findBestReplacement(
      fixedIds,
      pool,
      completedMatches,
      weights,
      playersPerMatch,
      config
    );
    if (!bestId) return;

    setProposals((prev) =>
      prev.map((p) => {
        if (p.courtNumber !== courtNumber) return p;
        const slots = [...p.slots];
        slots[slotIndex] = bestId;
        return { ...p, slots, score: recalcScore(slots) };
      })
    );
  }

  function pickPlayer(
    courtNumber: number,
    slotIndex: number,
    playerId: string
  ) {
    setPicking(null);
    setProposals((prev) =>
      prev.map((p) => {
        if (p.courtNumber !== courtNumber) return p;
        const slots = [...p.slots];
        slots[slotIndex] = playerId;
        return { ...p, slots, score: recalcScore(slots) };
      })
    );
  }

  // ─── Court / global regeneration ──────────────────────────────────────────

  function regenerateCourt(courtNumber: number) {
    setPicking(null);
    const otherUsed = new Set<string>();
    for (const p of proposals) {
      if (p.courtNumber !== courtNumber) {
        for (const id of p.slots) {
          if (id) otherUsed.add(id);
        }
      }
    }
    const pool = allBenchPlayers.filter((p) => !otherUsed.has(p.id));
    const results = generateMatches(
      pool,
      completedMatches,
      [courtNumber],
      weights,
      playersPerMatch,
      config
    );
    if (!results.length) return;
    const r = results[0];
    setProposals((prev) =>
      prev.map((p) =>
        p.courtNumber !== courtNumber
          ? p
          : {
              courtNumber: r.courtNumber,
              courtName: getCourtName(r.courtNumber, courtLabels),
              slots: [...r.playerIds],
              score: r.totalScore,
            }
      )
    );
  }

  function regenerateAll() {
    setPicking(null);
    const results = generateMatches(
      allBenchPlayers,
      completedMatches,
      selectedCourts,
      weights,
      playersPerMatch,
      config
    );
    setProposals(
      results.map((r) => ({
        courtNumber: r.courtNumber,
        courtName: getCourtName(r.courtNumber, courtLabels),
        slots: [...r.playerIds],
        score: r.totalScore,
      }))
    );
  }

  // ─── Confirm ───────────────────────────────────────────────────────────────

  function handleConfirm() {
    const playersPerTeam = playersPerMatch / 2;
    const matches: ConfirmedMatch[] = proposals
      .filter((p) => p.slots.every(Boolean))
      .map((p) => ({
        courtNumber: p.courtNumber,
        players: [
          ...p.slots.slice(0, playersPerTeam).map((id) => ({
            player_id: id!,
            team_number: 1 as const,
          })),
          ...p.slots.slice(playersPerTeam).map((id) => ({
            player_id: id!,
            team_number: 2 as const,
          })),
        ],
      }));
    onConfirm(matches);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const playersPerTeam = playersPerMatch / 2;
  const completeCount = proposals.filter((p) => p.slots.every(Boolean)).length;
  const allComplete = proposals.length > 0 && completeCount === proposals.length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>
            {mode === "draft" ? "Draft Proposals" : "Generated Matches"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] space-y-3 py-1 pr-1">
          {proposals.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                No matches could be generated with the current bench players.
              </p>
              {onManualFallback && (
                <Button variant="outline" size="sm" onClick={onManualFallback}>
                  {mode === "draft" ? "Add Manual Draft" : "Add Manual Match"}
                </Button>
              )}
            </div>
          ) : (
            proposals.map((proposal) => (
              <div
                key={proposal.courtNumber}
                className="rounded-lg border p-4 space-y-3"
              >
                {/* Court header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {proposal.courtName}
                    </span>
                    <Badge
                      className={`text-xs ${scoreBadgeClass(proposal.score)}`}
                    >
                      {scoreLabel(proposal.score)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => regenerateCourt(proposal.courtNumber)}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </Button>
                </div>

                {/* Teams */}
                <div className="grid grid-cols-[1fr,2rem,1fr] gap-2 items-start">
                  {/* Team 1 */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Team 1
                    </p>
                    {Array.from({ length: playersPerTeam }).map((_, i) => {
                      const slotIndex = i;
                      const isPicking =
                        picking?.courtNumber === proposal.courtNumber &&
                        picking?.slotIndex === slotIndex;
                      return (
                        <SlotCell
                          key={slotIndex}
                          playerId={proposal.slots[slotIndex]}
                          courtNumber={proposal.courtNumber}
                          slotIndex={slotIndex}
                          playerInfo={playerInfo}
                          availableToAdd={availableToAdd}
                          isPicking={isPicking}
                          onRemove={removePlayer}
                          onFillBest={fillBest}
                          onTogglePick={(cn, si) =>
                            setPicking(
                              picking?.courtNumber === cn &&
                                picking?.slotIndex === si
                                ? null
                                : { courtNumber: cn, slotIndex: si }
                            )
                          }
                          onPickPlayer={pickPlayer}
                        />
                      );
                    })}
                  </div>

                  {/* VS */}
                  <div className="flex items-center justify-center pt-6">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      vs
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Team 2
                    </p>
                    {Array.from({ length: playersPerTeam }).map((_, i) => {
                      const slotIndex = playersPerTeam + i;
                      const isPicking =
                        picking?.courtNumber === proposal.courtNumber &&
                        picking?.slotIndex === slotIndex;
                      return (
                        <SlotCell
                          key={slotIndex}
                          playerId={proposal.slots[slotIndex]}
                          courtNumber={proposal.courtNumber}
                          slotIndex={slotIndex}
                          playerInfo={playerInfo}
                          availableToAdd={availableToAdd}
                          isPicking={isPicking}
                          onRemove={removePlayer}
                          onFillBest={fillBest}
                          onTogglePick={(cn, si) =>
                            setPicking(
                              picking?.courtNumber === cn &&
                                picking?.slotIndex === si
                                ? null
                                : { courtNumber: cn, slotIndex: si }
                            )
                          }
                          onPickPlayer={pickPlayer}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={regenerateAll}
            className="sm:mr-auto"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Regenerate All
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!allComplete}>
            {mode === "draft"
              ? `Add ${completeCount} to Draft`
              : `Start ${completeCount} ${completeCount === 1 ? "Match" : "Matches"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Slot sub-component ───────────────────────────────────────────────────────

type SlotCellProps = {
  playerId: string | null;
  courtNumber: number;
  slotIndex: number;
  playerInfo: Map<string, PlayerDisplayInfo>;
  availableToAdd: AlgorithmPlayer[];
  isPicking: boolean;
  onRemove: (courtNumber: number, slotIndex: number) => void;
  onFillBest: (courtNumber: number, slotIndex: number) => void;
  onTogglePick: (courtNumber: number, slotIndex: number) => void;
  onPickPlayer: (courtNumber: number, slotIndex: number, playerId: string) => void;
};

function SlotCell({
  playerId,
  courtNumber,
  slotIndex,
  playerInfo,
  availableToAdd,
  isPicking,
  onRemove,
  onFillBest,
  onTogglePick,
  onPickPlayer,
}: SlotCellProps) {
  if (playerId) {
    const info = playerInfo.get(playerId);
    return (
      <div className="flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-sm min-w-0">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: genderColours[info?.gender ?? 2] }}
        />
        <span className="flex-1 truncate">{info?.name ?? "Unknown"}</span>
        {info?.skillText && (
          <span className="text-xs text-muted-foreground shrink-0">
            {info.skillText}
          </span>
        )}
        <button
          type="button"
          onClick={() => onRemove(courtNumber, slotIndex)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Remove player"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  // Empty slot
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 rounded-md border border-dashed px-2 py-1">
        <span className="flex-1 text-xs text-muted-foreground">Empty</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 px-1.5 text-[10px] gap-0.5 shrink-0"
          onClick={() => onFillBest(courtNumber, slotIndex)}
          disabled={availableToAdd.length === 0}
          title="Fill with best available player"
        >
          <Zap className="h-3 w-3" />
          Best
        </Button>
        <Button
          type="button"
          size="sm"
          variant={isPicking ? "secondary" : "ghost"}
          className="h-6 px-1.5 text-[10px] gap-0.5 shrink-0"
          onClick={() => onTogglePick(courtNumber, slotIndex)}
          title="Pick player manually"
        >
          <UserPlus className="h-3 w-3" />
          Add
        </Button>
      </div>

      {isPicking && (
        <div className="rounded-md border bg-popover shadow-md max-h-36 overflow-y-auto">
          {availableToAdd.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2 py-2 text-center">
              No players available
            </p>
          ) : (
            availableToAdd.map((p) => {
              const info = playerInfo.get(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPickPlayer(courtNumber, slotIndex, p.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: genderColours[info?.gender ?? 2],
                    }}
                  />
                  <span className="flex-1 text-left truncate">
                    {info?.name ?? p.name}
                  </span>
                  {info?.skillText && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {info.skillText}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
