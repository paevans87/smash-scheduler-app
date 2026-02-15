"use client";

import { useCallback } from "react";
import { Crown } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-6">
        <h1 className="text-3xl font-bold">Players</h1>
        <p className="text-muted-foreground">Loading players...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Players</h1>
          <p className="text-muted-foreground">
            {playerCount} of {maxPlayers} players used
          </p>
        </div>
      </div>

      {!canAddMore && (
        <div className="rounded-lg border bg-muted p-4">
          <div className="flex items-start gap-3">
            <Crown className="mt-0.5 size-5 text-amber-500" />
            <div>
              <p className="font-medium">Player limit reached</p>
              <p className="text-sm text-muted-foreground">
                You have reached the maximum of {maxPlayers} players for your plan.
                Upgrade to Pro for unlimited players.
              </p>
            </div>
          </div>
        </div>
      )}

      {isStale && (
        <p className="text-sm text-muted-foreground italic">
          Showing cached data — changes will sync when you are back online.
        </p>
      )}

      {players.length === 0 ? (
        <p className="text-muted-foreground">
          No players yet. Add your first player to get started.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              id={player.id}
              name={player.name}
              skillLevel={player.skill_level}
              gender={player.gender}
              clubSlug={clubSlug}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
