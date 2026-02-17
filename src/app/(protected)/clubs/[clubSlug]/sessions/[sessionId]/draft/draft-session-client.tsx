"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Minus, Trash2 } from "lucide-react";

type Player = {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  numerical_skill_level: number | null;
  skill_tier_id: string | null;
  skill_tier: { name: string } | null;
  gender: number;
};

type SessionPlayer = {
  player_id: string;
  is_active: boolean;
  players?: Player;
};

type CourtLabel = {
  court_number: number;
  label: string;
};

type DraftSessionClientProps = {
  sessionId: string;
  clubSlug: string;
  gameType: number;
  skillType: number;
  session: {
    id: string;
    scheduled_date_time: string;
    court_count: number;
    state: number;
  };
  availablePlayers: Player[];
  sessionPlayers: SessionPlayer[];
  courtLabels: CourtLabel[];
};

export function DraftSessionClient({
  sessionId,
  clubSlug,
  gameType,
  skillType,
  session,
  availablePlayers,
  sessionPlayers,
  courtLabels,
}: DraftSessionClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [courtCount, setCourtCount] = useState(session.court_count);
  const [labels, setLabels] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    courtLabels.forEach((cl) => {
      initial[cl.court_number] = cl.label;
    });
    return initial;
  });
  const [currentSessionPlayers, setCurrentSessionPlayers] = useState(sessionPlayers);

  useEffect(() => {
    setCurrentSessionPlayers(sessionPlayers);
  }, [sessionPlayers]);

  const scheduledDate = new Date(session.scheduled_date_time);

  const minPlayers = gameType === 0 ? 2 : 4;
  const gameTypeLabel = gameType === 0 ? "Singles" : "Doubles";

  const activePlayerCount = currentSessionPlayers.filter(
    (sp) => sp.is_active && sp.players
  ).length;

  const canCreateSession = activePlayerCount >= minPlayers;

  const sessionPlayerIds = new Set(currentSessionPlayers.map((sp) => sp.player_id));
  
  const actuallyAvailablePlayers = availablePlayers.filter(
    (player) => !sessionPlayerIds.has(player.id)
  );
  
  const filteredAvailablePlayers = actuallyAvailablePlayers.filter((player) => {
    const nm = (player.name ?? "").toLowerCase();
    return nm.includes(searchText.toLowerCase());
  });

  async function handleAddPlayer(playerId: string) {
    setIsLoading(true);
    try {
      const sessionPlayerData = {
        session_id: sessionId,
        player_id: playerId,
        is_active: true,
      };

      const { error } = await supabase.from("session_players").insert(sessionPlayerData);
      if (error) throw error;

      const player = availablePlayers.find((p) => p.id === playerId);
      if (player) {
        setCurrentSessionPlayers([
          ...currentSessionPlayers,
          { player_id: playerId, is_active: true, players: player },
        ]);
      }
    } catch {
      console.error("Failed to add player");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemovePlayer(playerId: string) {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("session_players")
        .delete()
        .eq("session_id", sessionId)
        .eq("player_id", playerId);

      if (error) throw error;

      setCurrentSessionPlayers(
        currentSessionPlayers.filter((sp) => sp.player_id !== playerId)
      );
    } catch {
      console.error("Failed to remove player");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCourtCountChange(newCount: number) {
    if (newCount < 1) return;
    setCourtCount(newCount);

    try {
      const { error } = await supabase
        .from("sessions")
        .update({ court_count: newCount })
        .eq("id", sessionId);

      if (error) throw error;
    } catch {
      console.error("Failed to update court count");
    }
  }

  async function handleLabelChange(courtNumber: number, label: string) {
    const newLabels = { ...labels, [courtNumber]: label };
    if (!label.trim()) {
      delete newLabels[courtNumber];
    }
    setLabels(newLabels);

    try {
      if (label.trim()) {
        await supabase.from("session_court_labels").upsert({
          session_id: sessionId,
          court_number: courtNumber,
          label: label.trim(),
        });
      } else {
        await supabase
          .from("session_court_labels")
          .delete()
          .eq("session_id", sessionId)
          .eq("court_number", courtNumber);
      }
    } catch {
      console.error("Failed to update court label");
    }
  }

  async function handleAbandonDraft() {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      router.push(`/clubs/${clubSlug}/sessions`);
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }

  async function handleCreateSession() {
    if (!canCreateSession) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .update({ state: 1, court_count: courtCount })
        .eq("id", sessionId);

      if (error) throw error;

      router.push(`/clubs/${clubSlug}/sessions/${sessionId}/active`);
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session Draft</h1>
          <p className="text-muted-foreground">
            {scheduledDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            at{" "}
            {scheduledDate.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Badge variant="secondary">Draft</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="courts">Courts</Label>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-r-none"
                  onClick={() => handleCourtCountChange(courtCount - 1)}
                  disabled={courtCount <= 1 || isLoading}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="courts"
                  type="number"
                  min={1}
                  max={20}
                  value={courtCount}
                  onChange={(e) => handleCourtCountChange(parseInt(e.target.value) || 1)}
                  className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-l-none"
                  onClick={() => handleCourtCountChange(courtCount + 1)}
                  disabled={courtCount >= 20 || isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Game Type:</span>
              <Badge variant="outline">{gameTypeLabel}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Players:</span>
              <Badge variant={canCreateSession ? "default" : "destructive"}>
                {activePlayerCount}
              </Badge>
            </div>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="court-labels">
              <AccordionTrigger>Custom Court Names</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: courtCount }, (_, i) => i + 1).map(
                    (courtNum) => (
                      <div key={courtNum} className="space-y-1">
                        <Label
                          htmlFor={`court-${courtNum}`}
                          className="text-xs"
                        >
                          Court {courtNum}
                        </Label>
                        <Input
                          id={`court-${courtNum}`}
                          placeholder={`Court ${courtNum}`}
                          value={labels[courtNum] || ""}
                          onChange={(e) =>
                            handleLabelChange(courtNum, e.target.value)
                          }
                          disabled={isLoading}
                        />
                      </div>
                    )
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Available Players ({actuallyAvailablePlayers.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredAvailablePlayers.map((player) => (
                  <div
                  key={player.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div>
                    <p className="font-medium">{player.name ?? `${player.first_name ?? ''} ${player.last_name ?? ''}`.trim()}</p>
                    <p className="text-xs text-muted-foreground">
                      Skill: {skillType === 0 ? player.numerical_skill_level : player.skill_tier?.name ?? 'Not set'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddPlayer(player.id)}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {filteredAvailablePlayers.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  {searchText
                    ? "No players match your search"
                    : "All players added to session"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Session Players ({activePlayerCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {currentSessionPlayers
                .filter((sp): sp is typeof sp & { players: Player } => !!sp.players)
                .map((sessionPlayer) => (
                  <div
                    key={sessionPlayer.player_id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div>
                      <p className="font-medium">
                      {sessionPlayer.players.name ?? `${sessionPlayer.players.first_name ?? ''} ${sessionPlayer.players.last_name ?? ''}`.trim()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Skill: {skillType === 0 ? sessionPlayer.players.numerical_skill_level : sessionPlayer.players.skill_tier?.name ?? 'Not set'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemovePlayer(sessionPlayer.player_id)}
                      disabled={isLoading}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              {currentSessionPlayers.filter((sp) => sp.players).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No players added yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {!canCreateSession && (
        <div className="rounded-md bg-destructive/10 p-4 text-destructive text-sm">
          You need at least {minPlayers} players to create a {gameTypeLabel.toLowerCase()} session.
        </div>
      )}

      <div className="flex justify-between pt-4">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isLoading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Abandon Draft
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Abandon Draft?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to abandon this draft? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAbandonDraft}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Abandon
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/clubs/${clubSlug}/sessions`)}
            disabled={isLoading}
          >
            Back
          </Button>
          <Button
            onClick={handleCreateSession}
            disabled={!canCreateSession || isLoading}
          >
            Create Session ({activePlayerCount} players)
          </Button>
        </div>
      </div>
    </div>
  );
}
