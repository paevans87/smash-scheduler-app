"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Club = {
  id: string;
  name: string;
  default_court_count: number;
  game_type: number;
};

type ClubSettingsFormProps = {
  club: Club;
  clubSlug: string;
};

export function ClubSettingsForm({ club, clubSlug }: ClubSettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(club.name);
  const [defaultCourtCount, setDefaultCourtCount] = useState(club.default_court_count);
  const [gameType, setGameType] = useState(club.game_type.toString());

  const isValid = name.trim() !== "" && defaultCourtCount >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("clubs")
        .update({
          name: name.trim(),
          default_court_count: defaultCourtCount,
          game_type: parseInt(gameType),
        })
        .eq("id", club.id);

      if (error) {
        throw error;
      }

      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Club Details</CardTitle>
          <CardDescription>Update your club information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Club Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter club name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courts">Default Number of Courts</Label>
            <Input
              id="courts"
              type="number"
              min={1}
              max={20}
              value={defaultCourtCount}
              onChange={(e) => setDefaultCourtCount(parseInt(e.target.value) || 1)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This will be the default when creating new sessions
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gameType">Default Game Type</Label>
            <Select value={gameType} onValueChange={setGameType}>
              <SelectTrigger id="gameType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Singles</SelectItem>
                <SelectItem value="1">Doubles</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Determines minimum players needed per session (2 for singles, 4 for doubles)
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={!isValid || isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/clubs/${clubSlug}`)}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
