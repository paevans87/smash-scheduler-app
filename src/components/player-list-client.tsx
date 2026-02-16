"use client";

import React, { useCallback, useState } from "react";
import { Crown, UserPlus } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { usePlayers } from "@/lib/offline/use-players";
import { PlayerCard } from "@/components/player-card";
import { canAddPlayer } from "@/lib/subscription/restrictions";
import type { PlanType } from "@/lib/subscription/hooks";

type PlayerListClientProps = {
  clubId: string;
  clubSlug: string;
  planType: PlanType;
  playerCount: number;
};

export function PlayerListClient({ clubId, clubSlug, planType, playerCount }: PlayerListClientProps) {
  const { players, isLoading, isStale, mutate } = usePlayers(clubId);

  const handleDeleted = useCallback(() => {
    mutate();
  }, [mutate]);

  const canAddMore = canAddPlayer(playerCount, planType);
  const maxPlayers = planType === "pro" ? "unlimited" : "16";

  // Simple filters state
  const [searchText, setSearchText] = useState<string>("");
  const [genderFilter, setGenderFilter] = useState<string>("any");
  const [minSkill, setMinSkill] = useState<number>(1);

  // Derived filtered list
  const filteredPlayers = players.filter((p: any) => {
    const name = [p?.first_name, p?.last_name].filter(Boolean).length
      ? `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim()
      : p?.name ?? "";
    const nameLC = (name ?? "").toLowerCase();
    if (searchText && !nameLC.includes(searchText.toLowerCase())) return false;
    const g = (p?.gender ?? 2).toString();
    if (genderFilter !== "any" && g !== genderFilter) return false;
    const skill = p?.skill_level ?? 0;
    if (skill < minSkill) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">Players</h1>
          <Link href={`/clubs/${clubSlug}/players/new`} className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-md)]">
            <UserPlus className="size-4" /> Add Player
          </Link>
        </div>
        <div className="flex items-center justify-center py-6">
          <span
            aria-label="loading"
            className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"
          />
        </div>
        <p className="text-muted-foreground text-center">Please wait while we load your players.</p>
      </div>
    );
  }

  // Main render
  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold">Players</h1>
        {canAddMore ? (
          <Link href={`/clubs/${clubSlug}/players/new`} className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-md)]">
            <UserPlus className="size-4" /> Add Player
          </Link>
        ) : (
          <span className="inline-flex items-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50">
            <UserPlus className="size-4" /> Add Player
          </span>
        )}
      </div>
      {planType === "free" && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
          <Crown className="size-4 shrink-0 text-amber-500" />
          <p className="text-amber-800 dark:text-amber-200">
            {canAddMore ? (
              <>
                You have {players.length} of 16 players on the free plan.{" "}
                <Link href={`/upgrade?club=${clubSlug}`} className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100">
                  Upgrade for unlimited players
                </Link>
              </>
            ) : (
              <>
                You have reached your maximum number of players.{" "}
                <Link href={`/upgrade?club=${clubSlug}`} className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100">
                  Upgrade for unlimited players
                </Link>
              </>
            )}
          </p>
        </div>
      )}
      {players.length > 0 && (
      <Card className="border rounded-lg bg-muted mb-4">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4">
          <div>
            <Label>Name</Label>
            <Input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search by name" />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="0">Male</SelectItem>
                <SelectItem value="1">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Min Skill</Label>
            <Slider min={1} max={10} value={[minSkill]} onValueChange={([v]) => setMinSkill(v)} />
            <div className="text-xs text-muted-foreground mt-1">Current: {minSkill}</div>
          </div>
        </CardContent>
      </Card>
      )}

      {isStale && (
        <p className="text-sm text-muted-foreground italic">Showing cached data — changes will sync when you are back online.</p>
      )}

      {filteredPlayers.length === 0 ? (
        <div className="rounded-lg border bg-muted p-6 text-center">
          <p className="mb-2 text-sm text-muted-foreground">
            {canAddMore ? "You haven't set up any players yet, click here to add." : "You have reached your maximum number of players."}
          </p>
          {canAddMore && (
            <Link href={`/clubs/${clubSlug}/players/new`} className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              Add Player
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => {
            const displayName = [player?.first_name, player?.last_name].filter(Boolean).length
              ? `${player?.first_name ?? ''} ${player?.last_name ?? ''}`.trim()
              : player?.name ?? '';
            return (
              <PlayerCard
                key={player.id}
                id={player.id}
                name={displayName}
                skillLevel={player.skill_level}
                gender={player.gender}
                clubSlug={clubSlug}
                onDeleted={handleDeleted}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
