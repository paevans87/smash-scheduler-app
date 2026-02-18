"use client";

import { useState, useEffect, useCallback } from "react";
import { FlaskConical, Plus, Trash2, Crown, Users, ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import {
  runSimulation,
  type SimulatorPlayer,
  type SimulationResults,
} from "@/lib/simulator";
import type { ScoringWeights, MatchConfig } from "@/lib/matchmaking";

type MatchMakingProfile = {
  id: string;
  club_id: string | null;
  name: string;
  weight_skill_balance: number;
  weight_time_off_court: number;
  weight_match_history: number;
  apply_gender_matching: boolean;
  gender_matching_mode: number;
  blacklist_mode: number;
  level_multiplier: number;
  mix_multiplier: number;
  asymmetric_gender_multiplier: number;
};

type ClubPlayer = {
  id: string;
  name: string | null;
  gender: number;
  numerical_skill_level: number | null;
  play_style_preference: number;
};

type Props = {
  profiles: MatchMakingProfile[];
  defaultProfileId: string | null;
  gameType: number; // 0=singles, 1=doubles
  clubId: string;
  clubSlug: string;
  disabled: boolean;
};

const PLAY_STYLE_LABELS: Record<number, string> = {
  0: "Open",
  1: "Mix",
  2: "Level",
};

const GENDER_LABEL: Record<number, string> = { 0: "M", 1: "F" };

let playerIdCounter = 1;

function makeDefaultPlayers(gameType: number): SimulatorPlayer[] {
  const isDoubles = gameType === 1;
  const count = isDoubles ? 8 : 4;
  const defaults: SimulatorPlayer[] = [];
  const skills = [3, 5, 6, 8, 4, 7, 5, 6];
  for (let i = 0; i < count; i++) {
    defaults.push({
      id: `sim-default-${playerIdCounter++}`,
      name: `Player ${i + 1}`,
      gender: i % 2,
      skillLevel: skills[i] ?? 5,
      playStylePreference: 0,
    });
  }
  return defaults;
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: "good" | "warn" | "bad" | "neutral";
}) {
  const highlightClass =
    highlight === "good"
      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
      : highlight === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950"
        : highlight === "bad"
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
          : "border-border bg-muted/30";

  const valueClass =
    highlight === "good"
      ? "text-green-700 dark:text-green-300"
      : highlight === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : highlight === "bad"
          ? "text-red-700 dark:text-red-300"
          : "text-foreground";

  return (
    <div className={`rounded-lg border p-3 ${highlightClass}`}>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}

export function MatchmakingSimulatorDialog({
  profiles,
  defaultProfileId,
  gameType,
  clubId,
  clubSlug,
  disabled,
}: Props) {
  const playersPerMatch = gameType === 1 ? 4 : 2;
  const isDoubles = gameType === 1;

  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<SimulatorPlayer[]>(() =>
    makeDefaultPlayers(gameType)
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    defaultProfileId ?? profiles[0]?.id ?? ""
  );
  const [courts, setCourts] = useState(2);
  const [simulationMode, setSimulationMode] = useState<"rounds" | "duration">("rounds");
  const [rounds, setRounds] = useState(20);
  const [sessionHours, setSessionHours] = useState(2);
  const [avgGameMinutes, setAvgGameMinutes] = useState(20);
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [clubPlayers, setClubPlayers] = useState<ClubPlayer[] | null>(null);
  const [loadingClubPlayers, setLoadingClubPlayers] = useState(false);
  const [showClubPicker, setShowClubPicker] = useState(false);
  const [selectedClubPlayerIds, setSelectedClubPlayerIds] = useState<Set<string>>(new Set());

  const computedRounds =
    simulationMode === "duration"
      ? Math.max(1, Math.floor((sessionHours * 60) / avgGameMinutes))
      : rounds;

  const effectiveRounds = computedRounds;
  const minPlayersNeeded = playersPerMatch;
  const hasEnoughPlayers = players.length >= minPlayersNeeded;

  const fetchClubPlayers = useCallback(async () => {
    if (clubPlayers !== null) return;
    setLoadingClubPlayers(true);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("players")
        .select("id, name, gender, numerical_skill_level, play_style_preference")
        .eq("club_id", clubId)
        .order("name", { ascending: true });
      setClubPlayers(data ?? []);
    } finally {
      setLoadingClubPlayers(false);
    }
  }, [clubId, clubPlayers]);

  useEffect(() => {
    if (open) {
      fetchClubPlayers();
    }
  }, [open, fetchClubPlayers]);

  const selectedProfile = profiles.find((p) => p.id === selectedProfileId) ?? profiles[0];

  function addMockPlayer() {
    setPlayers((prev) => [
      ...prev,
      {
        id: `sim-mock-${playerIdCounter++}`,
        name: `Player ${prev.length + 1}`,
        gender: prev.length % 2,
        skillLevel: 5,
        playStylePreference: 0,
      },
    ]);
  }

  function removePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  }

  function updatePlayer(id: string, field: keyof SimulatorPlayer, value: string | number) {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function toggleClubPlayerSelection(id: string) {
    setSelectedClubPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function importSelectedClubPlayers() {
    if (!clubPlayers) return;
    const toImport = clubPlayers.filter((cp) => selectedClubPlayerIds.has(cp.id));
    const newPlayers: SimulatorPlayer[] = toImport.map((cp) => ({
      id: `sim-club-${cp.id}-${playerIdCounter++}`,
      name: cp.name ?? "Unknown",
      gender: cp.gender,
      skillLevel: cp.numerical_skill_level ?? 5,
      playStylePreference: cp.play_style_preference ?? 0,
    }));
    setPlayers((prev) => [...prev, ...newPlayers]);
    setSelectedClubPlayerIds(new Set());
    setShowClubPicker(false);
  }

  function handleRun() {
    if (!selectedProfile || !hasEnoughPlayers) return;

    const weights: ScoringWeights = {
      skillBalance: selectedProfile.weight_skill_balance,
      matchHistory: selectedProfile.weight_match_history,
      timeOffCourt: selectedProfile.weight_time_off_court,
    };

    const matchConfig: MatchConfig = {
      applyGenderMatching: selectedProfile.apply_gender_matching,
      genderMatchingMode: selectedProfile.gender_matching_mode,
      blacklistMode: selectedProfile.blacklist_mode,
      levelMultiplier: selectedProfile.level_multiplier,
      mixMultiplier: selectedProfile.mix_multiplier,
      asymmetricGenderMultiplier: selectedProfile.asymmetric_gender_multiplier,
    };

    const sim = runSimulation({
      players,
      courts,
      rounds: effectiveRounds,
      avgGameDurationMinutes: simulationMode === "duration" ? avgGameMinutes : 20,
      weights,
      matchConfig,
      playersPerMatch,
    });

    setResults(sim);
  }

  function handleReset() {
    setResults(null);
  }

  const avgGamesRounded = results ? Math.round(results.avgGames * 10) / 10 : 0;

  const getDuplicateHighlight = (val: number, total: number): "good" | "warn" | "bad" => {
    if (total === 0) return "good";
    const ratio = val / total;
    if (ratio < 0.1) return "good";
    if (ratio < 0.25) return "warn";
    return "bad";
  };

  const getVarianceHighlight = (min: number, max: number, avg: number): "good" | "warn" | "bad" => {
    if (avg === 0) return "neutral" as never;
    const spread = max - min;
    if (spread <= 2) return "good";
    if (spread <= 4) return "warn";
    return "bad";
  };

  return (
    <>
      <Button
        variant="outline"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className="relative"
      >
        {disabled ? (
          <Crown className="mr-2 size-4 text-amber-500" />
        ) : (
          <FlaskConical className="mr-2 size-4" />
        )}
        Simulator
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="size-5" />
              Matchmaking Profile Simulator
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Profile selector */}
            <div className="space-y-1.5">
              <Label>Profile to simulate</Label>
              <Select value={selectedProfileId} onValueChange={(v) => { setSelectedProfileId(v); setResults(null); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                      {p.club_id === null && (
                        <span className="ml-2 text-xs text-muted-foreground">(System)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProfile && (
                <p className="text-xs text-muted-foreground">
                  Skill {selectedProfile.weight_skill_balance}% · Time off {selectedProfile.weight_time_off_court}% · History {selectedProfile.weight_match_history}%
                  {selectedProfile.apply_gender_matching && (
                    <> · Gender matching {selectedProfile.gender_matching_mode === 1 ? "strict" : "preferred"}</>
                  )}
                </p>
              )}
            </div>

            <Separator />

            {/* Players section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Players</Label>
                <Badge variant="secondary">{players.length} players</Badge>
              </div>

              {players.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No players added yet.</p>
              ) : (
                <div className="space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_56px_60px_100px_32px] gap-2 px-1">
                    <span className="text-xs text-muted-foreground">Name</span>
                    <span className="text-xs text-muted-foreground text-center">Gender</span>
                    <span className="text-xs text-muted-foreground text-center">Skill</span>
                    <span className="text-xs text-muted-foreground">Style</span>
                    <span />
                  </div>
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="grid grid-cols-[1fr_56px_60px_100px_32px] gap-2 items-center"
                    >
                      <Input
                        value={player.name}
                        onChange={(e) => updatePlayer(player.id, "name", e.target.value)}
                        className="h-8 text-sm"
                      />
                      {/* Gender toggle */}
                      <div className="flex rounded-md border overflow-hidden">
                        <button
                          type="button"
                          className={`flex-1 text-xs py-1 transition-colors ${player.gender === 0 ? "bg-blue-500 text-white" : "hover:bg-muted"}`}
                          onClick={() => updatePlayer(player.id, "gender", 0)}
                        >
                          M
                        </button>
                        <button
                          type="button"
                          className={`flex-1 text-xs py-1 transition-colors ${player.gender === 1 ? "bg-pink-500 text-white" : "hover:bg-muted"}`}
                          onClick={() => updatePlayer(player.id, "gender", 1)}
                        >
                          F
                        </button>
                      </div>
                      {/* Skill */}
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={player.skillLevel}
                        onChange={(e) => {
                          const v = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
                          updatePlayer(player.id, "skillLevel", v);
                        }}
                        className="h-8 text-sm text-center"
                      />
                      {/* Play style */}
                      <Select
                        value={String(player.playStylePreference)}
                        onValueChange={(v) => updatePlayer(player.id, "playStylePreference", parseInt(v))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Open</SelectItem>
                          <SelectItem value="1">Mix</SelectItem>
                          <SelectItem value="2">Level</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removePlayer(player.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add players buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={addMockPlayer}>
                  <Plus className="mr-1.5 size-3.5" />
                  Add Player
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowClubPicker((v) => !v)}
                >
                  <Users className="mr-1.5 size-3.5" />
                  Add from Club
                  {showClubPicker ? (
                    <ChevronUp className="ml-1.5 size-3.5" />
                  ) : (
                    <ChevronDown className="ml-1.5 size-3.5" />
                  )}
                </Button>
              </div>

              {/* Club player picker */}
              {showClubPicker && (
                <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                  {loadingClubPlayers ? (
                    <p className="text-sm text-muted-foreground">Loading club players...</p>
                  ) : !clubPlayers || clubPlayers.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No club players found.</p>
                  ) : (
                    <>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {clubPlayers.map((cp) => (
                          <label
                            key={cp.id}
                            className="flex items-center gap-2 cursor-pointer hover:bg-muted rounded px-1 py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={selectedClubPlayerIds.has(cp.id)}
                              onChange={() => toggleClubPlayerSelection(cp.id)}
                              className="rounded"
                            />
                            <span className="text-sm flex-1">{cp.name ?? "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">
                              {GENDER_LABEL[cp.gender] ?? "?"} · Skill {cp.numerical_skill_level ?? "—"} · {PLAY_STYLE_LABELS[cp.play_style_preference] ?? "Open"}
                            </span>
                          </label>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        disabled={selectedClubPlayerIds.size === 0}
                        onClick={importSelectedClubPlayers}
                      >
                        Import {selectedClubPlayerIds.size > 0 ? `${selectedClubPlayerIds.size} ` : ""}Selected
                      </Button>
                    </>
                  )}
                </div>
              )}

              {!hasEnoughPlayers && players.length > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  At least {minPlayersNeeded} players required ({playersPerMatch} per {isDoubles ? "doubles" : "singles"} match).
                </p>
              )}
            </div>

            <Separator />

            {/* Simulation settings */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Simulation Settings</Label>

              {/* Courts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Courts</Label>
                  <span className="text-sm font-medium w-6 text-right">{courts}</span>
                </div>
                <Slider
                  min={1}
                  max={12}
                  step={1}
                  value={[courts]}
                  onValueChange={([v]) => { setCourts(v); setResults(null); }}
                />
              </div>

              {/* Simulation mode */}
              <div className="space-y-3">
                <div className="flex rounded-lg border overflow-hidden w-fit">
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-sm transition-colors ${simulationMode === "rounds" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    onClick={() => { setSimulationMode("rounds"); setResults(null); }}
                  >
                    Fixed Rounds
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-1.5 text-sm transition-colors ${simulationMode === "duration" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    onClick={() => { setSimulationMode("duration"); setResults(null); }}
                  >
                    Session Duration
                  </button>
                </div>

                {simulationMode === "rounds" ? (
                  <div className="space-y-1.5">
                    <Label className="text-sm">Number of rounds</Label>
                    <Input
                      type="number"
                      min={5}
                      max={200}
                      value={rounds}
                      onChange={(e) => {
                        setRounds(Math.min(200, Math.max(5, parseInt(e.target.value) || 5)));
                        setResults(null);
                      }}
                      className="w-28"
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-sm">Session length (hours)</Label>
                      <Input
                        type="number"
                        min={0.5}
                        max={8}
                        step={0.5}
                        value={sessionHours}
                        onChange={(e) => {
                          setSessionHours(Math.min(8, Math.max(0.5, parseFloat(e.target.value) || 1)));
                          setResults(null);
                        }}
                        className="w-24"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm">Avg game length (min)</Label>
                      <Input
                        type="number"
                        min={3}
                        max={60}
                        value={avgGameMinutes}
                        onChange={(e) => {
                          setAvgGameMinutes(Math.min(60, Math.max(5, parseInt(e.target.value) || 20)));
                          setResults(null);
                        }}
                        className="w-24"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground pb-1">
                      = <strong>{computedRounds}</strong> rounds
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Run button */}
            <Button
              className="w-full"
              onClick={results ? handleReset : handleRun}
              disabled={!hasEnoughPlayers || !selectedProfile}
            >
              {results ? (
                <>
                  <FlaskConical className="mr-2 size-4" />
                  Run Again
                </>
              ) : (
                <>
                  <FlaskConical className="mr-2 size-4" />
                  Run Simulation ({effectiveRounds} rounds · {players.length} players · {courts} court{courts !== 1 ? "s" : ""})
                </>
              )}
            </Button>

            {/* Results */}
            {results && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Results</Label>

                  {/* Summary stat cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard
                      label="Total Games"
                      value={results.totalGames}
                      highlight="neutral"
                    />
                    <StatCard
                      label="Level Games"
                      value={results.levelGames}
                      highlight="neutral"
                    />
                    {isDoubles && selectedProfile?.apply_gender_matching && (
                      <StatCard
                        label="Mix Games"
                        value={results.mixGames}
                        highlight="neutral"
                      />
                    )}
                    {selectedProfile?.apply_gender_matching &&
                      selectedProfile.gender_matching_mode === 0 && (
                        <StatCard
                          label="Funny Mix Games"
                          value={results.funnyMixGames}
                          highlight={
                            results.funnyMixGames === 0
                              ? "good"
                              : getDuplicateHighlight(results.funnyMixGames, results.totalGames)
                          }
                        />
                      )}
                    <StatCard
                      label="Duplicate Games"
                      value={results.duplicateGames}
                      highlight={getDuplicateHighlight(results.duplicateGames, results.totalGames)}
                    />
                    {isDoubles && (
                      <StatCard
                        label="Duplicate Partners"
                        value={results.duplicatePartners}
                        highlight={getDuplicateHighlight(results.duplicatePartners, results.totalGames * 2)}
                      />
                    )}
                    <StatCard
                      label="Duplicate Opponents"
                      value={results.duplicateOpponents}
                      highlight={getDuplicateHighlight(results.duplicateOpponents, results.totalGames * (isDoubles ? 4 : 1))}
                    />
                  </div>

                  {/* Games per player */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Games per player</span>
                      <span className="text-muted-foreground">
                        min {results.minGames} · avg {avgGamesRounded} · max {results.maxGames}
                      </span>
                    </div>
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left px-3 py-2 font-medium text-muted-foreground">Player</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Gender</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Skill</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">Games</th>
                            <th className="text-right px-3 py-2 font-medium text-muted-foreground">vs avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.playerStats
                            .slice()
                            .sort((a, b) => b.games - a.games)
                            .map((stat) => {
                              const player = players.find((p) => p.id === stat.id);
                              const diff = stat.games - results.avgGames;
                              const absDiff = Math.abs(diff);
                              const diffLabel =
                                diff > 0 ? `+${Math.round(diff * 10) / 10}` : `${Math.round(diff * 10) / 10}`;
                              const diffClass =
                                absDiff <= 1.5
                                  ? "text-green-600 dark:text-green-400"
                                  : absDiff <= 3
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-red-600 dark:text-red-400";
                              return (
                                <tr key={stat.id} className="border-b last:border-0">
                                  <td className="px-3 py-2">{stat.name}</td>
                                  <td className="px-3 py-2 text-right text-muted-foreground">
                                    {player ? (player.gender === 0 ? "M" : "F") : "—"}
                                  </td>
                                  <td className="px-3 py-2 text-right text-muted-foreground">
                                    {player?.skillLevel ?? "—"}
                                  </td>
                                  <td className="px-3 py-2 text-right font-medium">{stat.games}</td>
                                  <td className={`px-3 py-2 text-right text-xs ${diffClass}`}>
                                    {diffLabel}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Variance (max − min):</span>
                      <Badge
                        variant="secondary"
                        className={
                          getVarianceHighlight(results.minGames, results.maxGames, results.avgGames) === "good"
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : getVarianceHighlight(results.minGames, results.maxGames, results.avgGames) === "warn"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }
                      >
                        {results.maxGames - results.minGames}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {getVarianceHighlight(results.minGames, results.maxGames, results.avgGames) === "good"
                          ? "Good fairness"
                          : getVarianceHighlight(results.minGames, results.maxGames, results.avgGames) === "warn"
                            ? "Some variance"
                            : "High variance"}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Upgrade prompt for disabled state — shouldn't be reachable, but just in case */}
          {disabled && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
              <Crown className="size-4 shrink-0 text-amber-500" />
              <p className="text-amber-800 dark:text-amber-200">
                The simulator is a Pro feature.{" "}
                <a
                  href={`/upgrade?club=${clubSlug}`}
                  className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                >
                  Upgrade to access it
                </a>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
