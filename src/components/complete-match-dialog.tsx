"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MatchPlayer = {
  player_id: string;
  team_number: number;
};

type Match = {
  id: string;
  court_number: number;
  players: MatchPlayer[];
};

type CompleteMatchDialogProps = {
  open: boolean;
  onClose: () => void;
  match: Match | null;
  getPlayerName: (playerId: string) => string;
  getCourtName: (courtNumber: number) => string;
  onConfirm: (
    matchId: string,
    winningTeam: number | null,
    team1Score: number | null,
    team2Score: number | null
  ) => void;
};

export function CompleteMatchDialog({
  open,
  onClose,
  match,
  getPlayerName,
  getCourtName,
  onConfirm,
}: CompleteMatchDialogProps) {
  const [winningTeam, setWinningTeam] = useState<number | null>(null);
  const [team1Score, setTeam1Score] = useState<string>("");
  const [team2Score, setTeam2Score] = useState<string>("");

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setWinningTeam(null);
      setTeam1Score("");
      setTeam2Score("");
      onClose();
    }
  }

  function handleConfirm() {
    if (!match) return;
    const t1 = team1Score.trim() !== "" ? parseInt(team1Score, 10) : null;
    const t2 = team2Score.trim() !== "" ? parseInt(team2Score, 10) : null;
    // Scores must be provided together or not at all
    const scores =
      t1 !== null && t2 !== null && !isNaN(t1) && !isNaN(t2)
        ? { t1, t2 }
        : null;
    onConfirm(match.id, winningTeam, scores?.t1 ?? null, scores?.t2 ?? null);
    setWinningTeam(null);
    setTeam1Score("");
    setTeam2Score("");
  }

  if (!match) return null;

  const team1Players = match.players.filter((mp) => mp.team_number === 1);
  const team2Players = match.players.filter((mp) => mp.team_number === 2);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Complete Match</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {getCourtName(match.court_number)}
          </p>

          {/* Team summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Team 1
              </p>
              {team1Players.map((mp) => (
                <p key={mp.player_id} className="text-sm">
                  {getPlayerName(mp.player_id)}
                </p>
              ))}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Team 2
              </p>
              {team2Players.map((mp) => (
                <p key={mp.player_id} className="text-sm">
                  {getPlayerName(mp.player_id)}
                </p>
              ))}
            </div>
          </div>

          {/* Winner selection */}
          <div className="space-y-2">
            <Label className="text-sm">Winner (optional)</Label>
            <div className="flex gap-2">
              {[
                { value: 1, label: "Team 1" },
                { value: null, label: "Draw" },
                { value: 2, label: "Team 2" },
              ].map((opt) => (
                <Button
                  key={String(opt.value)}
                  size="sm"
                  variant={winningTeam === opt.value && (opt.value !== null || winningTeam === null) ? "default" : "outline"}
                  className="flex-1"
                  onClick={() =>
                    setWinningTeam(
                      winningTeam === opt.value ? null : opt.value
                    )
                  }
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Score entry */}
          <div className="space-y-2">
            <Label className="text-sm">Score (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="T1"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
                className="w-16 text-center"
              />
              <span className="text-muted-foreground font-medium">–</span>
              <Input
                type="number"
                min={0}
                placeholder="T2"
                value={team2Score}
                onChange={(e) => setTeam2Score(e.target.value)}
                className="w-16 text-center"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Complete Match</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
