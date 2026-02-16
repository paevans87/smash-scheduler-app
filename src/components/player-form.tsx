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

// NOTE: The UI now separates the name into First Name and Last Name
// The backend still uses a single name field, so we will compose it on save
// and keep the local client state aligned with the existing offline store.
function extractFirstName(full?: string) {
  if (!full) return "";
  const parts = full.trim().split(/\s+/);
  return parts[0] ?? "";
}

function extractLastName(full?: string) {
  if (!full) return "";
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}

type Player = {
  id: string;
  first_name?: string;
  last_name?: string | null;
  name?: string; // backward-compat when present
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
  // Split the name into first and last names for the form
  const [firstName, setFirstName] = useState<string>(player?.first_name ?? extractFirstName(player?.name ?? ""));
  const [lastName, setLastName] = useState<string>(player?.last_name ?? extractLastName(player?.name ?? ""));
  const [skillLevel, setSkillLevel] = useState(player?.skill_level ?? 5);
  const [gender, setGender] = useState(String(player?.gender ?? 0));
  const [playStyle, setPlayStyle] = useState(String(player?.play_style_preference ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fullName = [firstName, lastName].filter((n) => n?.toString().trim() !== "").join(" ").trim();
    if (!fullName) {
      setError("Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      first_name: firstName?.trim(),
      last_name: (lastName?.trim() ?? null) as any,
      name: fullName,
      skill_level: skillLevel,
      gender: Number(gender),
      play_style_preference: Number(playStyle),
    };

    if (isOnline) {
      const supabase = createClient();
      let result: any;
      result = player
        ? await supabase.from("players").update(payload).eq("id", player.id)
        : await supabase.from("players").insert({ ...payload, club_id: clubId });

      if (result?.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      // If creating a new player, we may want to redirect to the edit page
      // to configure blacklist after creation. We can only do this if we
      // have the new id from the insert response.
      // After adding, stay on the listing page to ensure the UI reflects the new entry
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">First Name</Label>
          <Input
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name">Last Name</Label>
          <Input
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
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
