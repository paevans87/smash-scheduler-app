"use client";

import React, { useState, useImperativeHandle, forwardRef } from "react";
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
  first_name?: string;
  last_name?: string | null;
  name?: string;
  skill_level: number;
  gender: number;
  play_style_preference: number;
};

type PlayerFormProps = {
  clubId: string;
  clubSlug: string;
  player?: Partial<Player> & { id?: string };
  onSave?: (playerId: string) => Promise<void>;
  /** Hide the built-in submit/cancel buttons (use formId to submit externally) */
  hideActions?: boolean;
  /** Stable form id so external buttons can target this form */
  formId?: string;
};

const genderOptions = [
  { value: "0", label: "Male" },
  { value: "1", label: "Female" },
];

const playStyleOptions = [
  { value: "0", label: "Open / No preference" },
  { value: "1", label: "Mix (male + female)" },
  { value: "2", label: "Level (same gender)" },
];

export type PlayerFormHandle = { getPayload: () => any; isSaving: () => boolean };

export const PlayerForm = forwardRef<PlayerFormHandle, PlayerFormProps>(function PlayerForm({ clubId, clubSlug, player, onSave, hideActions, formId }, ref) {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();

  // Local state for First/Last name separation
  const [firstName, setFirstName] = useState<string>(player?.first_name ?? (player?.name ?? "").split(" ")[0] ?? "");
  const lastNameInit = player?.last_name ?? (player?.name ?? "").split(" ").slice(1).join(" ");
  const [lastName, setLastName] = useState<string>(lastNameInit ?? "");
  const [skillLevel, setSkillLevel] = useState<number>(player?.skill_level ?? 5);
  const [gender, setGender] = useState<string>(String(player?.gender ?? 0));
  const [playStyle, setPlayStyle] = useState<string>(String(player?.play_style_preference ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPayload = () => {
    const fullName = [firstName, lastName].filter((n) => (n ?? "").trim() !== "").join(" ").trim();
    return {
      first_name: firstName?.trim(),
      last_name: (lastName?.trim() ?? null) as any,
      name: fullName,
      skill_level: skillLevel,
      gender: Number(gender),
      play_style_preference: Number(playStyle),
    };
  };

  useImperativeHandle(ref, () => ({ getPayload, isSaving: () => saving }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = getPayload();
    if (!payload.name) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    let savedPlayerId = player?.id;
    if (isOnline) {
      const supabase = createClient();
      if (player?.id) {
        const result = await supabase.from("players").update(payload).eq("id", player.id);
        if (result.error) {
          setError(result.error.message);
          setSaving(false);
          return;
        }
      } else {
        const result = await supabase.from("players").insert({ ...payload, club_id: clubId }).select("id").single();
        if (result.error) {
          setError(result.error.message);
          setSaving(false);
          return;
        }
        savedPlayerId = result.data.id;
      }
    } else {
      const db = await getDb();
      if (player?.id) {
        await db.put("players", { id: player.id, club_id: clubId, ...payload });
        await enqueuePendingChange({ table: "players", operation: "update", payload: { id: player.id, ...payload } } as any);
      } else {
        const id = crypto.randomUUID();
        savedPlayerId = id;
        await db.put("players", { id, club_id: clubId, ...payload });
        await enqueuePendingChange({ table: "players", operation: "insert", payload: { id, club_id: clubId, ...payload } } as any);
      }
    }
    if (onSave && savedPlayerId) {
      await onSave(savedPlayerId);
    }
    router.push(`/clubs/${clubSlug}/players`);
    router.refresh();
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="max-w-md space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first-name">First Name</Label>
          <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name">Last Name</Label>
          <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Skill Level: {skillLevel}</Label>
        <Slider min={1} max={10} value={[skillLevel]} onValueChange={([v]) => setSkillLevel(v)} />
        <div className="text-xs text-muted-foreground">1 (Beginner) – 10 (Elite)</div>
      </div>

      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {genderOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Play Style Preference</Label>
        <Select value={playStyle} onValueChange={setPlayStyle}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {playStyleOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!hideActions && (
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : player ? "Update Player" : "Add Player"}</Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/clubs/${clubSlug}/players`)}>Cancel</Button>
        </div>
      )}
    </form>
  );
});
