"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/offline/online-status-provider";
import { enqueuePendingChange } from "@/lib/offline/pending-changes";
import { getDb } from "@/lib/offline/db";

type Player = {
  id: string;
  name: string;
  skill_level: number;
  gender: number;
  play_style_preference: number;
};

type PlayerFormProps = {
  clubId: string;
  clubSlug: string;
  player?: Player;
};

const genderOptions = [
  { value: "0", label: "Male" },
  { value: "1", label: "Female" }
];

const playStyleOptions = [
  { value: "0", label: "Open / No preference" },
  { value: "1", label: "Mix (male + female)" },
  { value: "2", label: "Level (same gender)" },
];

export function PlayerForm({ clubId, clubSlug, player }: PlayerFormProps) {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();
  const [name, setName] = useState(player?.name ?? "");
  const [skillLevel, setSkillLevel] = useState(player?.skill_level ?? 5);
  const [gender, setGender] = useState(String(player?.gender ?? 0));
  const [playStyle, setPlayStyle] = useState(String(player?.play_style_preference ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      skill_level: skillLevel,
      gender: Number(gender),
      play_style_preference: Number(playStyle),
    };

    if (isOnline) {
      const supabase = createClient();
      const result = player
        ? await supabase.from("players").update(payload).eq("id", player.id)
        : await supabase.from("players").insert({ ...payload, club_id: clubId });

      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
    } else {
      const db = await getDb();

      if (player) {
        await db.put("players", {
          id: player.id,
          club_id: clubId,
          ...payload,
        });
        await enqueuePendingChange({
          table: "players",
          operation: "update",
          payload: { id: player.id, ...payload },
        });
      } else {
        const id = crypto.randomUUID();
        await db.put("players", {
          id,
          club_id: clubId,
          ...payload,
        });
        await enqueuePendingChange({
          table: "players",
          operation: "insert",
          payload: { id, club_id: clubId, ...payload },
        });
      }
    }

    router.push(`/clubs/${clubSlug}/players`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Skill Level: {skillLevel}</Label>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[skillLevel]}
          onValueChange={([val]) => setSkillLevel(val)}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 (Beginner)</span>
          <span>10 (Elite)</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {genderOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Play Style Preference</Label>
        <Select value={playStyle} onValueChange={setPlayStyle}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {playStyleOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : player ? "Update Player" : "Add Player"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/clubs/${clubSlug}/players`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
