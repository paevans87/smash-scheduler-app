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

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  name?: string;
  slug?: string;
  numerical_skill_level: number | null;
  skill_tier_id: string | null;
  gender: number;
  play_style_preference: number;
};

export type SkillTier = {
  id: string;
  club_id: string | null;
  name: string;
  score: number;
  display_order: number;
};

type PlayerFormProps = {
  clubId: string;
  clubSlug: string;
  skillType: number;
  tiers: SkillTier[];
  player?: Partial<Player> & { id?: string };
  onSave?: (playerId: string) => Promise<void>;
  hideActions?: boolean;
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

function generatePlayerSlug(firstName: string, lastName: string): string {
  const combined = `${firstName} ${lastName}`.trim();
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type PlayerFormHandle = { getPayload: () => Record<string, unknown>; isSaving: () => boolean };

export const PlayerForm = forwardRef<PlayerFormHandle, PlayerFormProps>(function PlayerForm({ clubId, clubSlug, skillType, tiers, player, onSave, hideActions, formId }, ref) {
  const router = useRouter();

  const [firstName, setFirstName] = useState<string>(player?.first_name ?? "");
  const [lastName, setLastName] = useState<string>(player?.last_name ?? "");
  const [skillLevel, setSkillLevel] = useState<number>(player?.numerical_skill_level ?? 5);
  const [skillTierId, setSkillTierId] = useState<string>(player?.skill_tier_id ?? "");
  const [gender, setGender] = useState<string>(String(player?.gender ?? 0));
  const [playStyle, setPlayStyle] = useState<string>(String(player?.play_style_preference ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedTiers = [...tiers].sort((a, b) => a.display_order - b.display_order);

  const getPayload = () => {
    const fullName = [firstName, lastName].filter((n) => (n ?? "").trim() !== "").join(" ").trim();
    return {
      first_name: firstName?.trim(),
      last_name: lastName?.trim() ?? null,
      name: fullName,
      numerical_skill_level: skillType === 0 ? skillLevel : null,
      skill_tier_id: skillType === 1 ? (skillTierId === "" ? null : skillTierId) : null,
      gender: Number(gender),
      play_style_preference: Number(playStyle),
    };
  };

  useImperativeHandle(ref, () => ({ getPayload, isSaving: () => saving }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = getPayload();
    if (!payload.first_name?.trim() || !payload.last_name?.trim()) {
      setError("First name and last name are required.");
      return;
    }
    setSaving(true);
    setError(null);
    let savedPlayerId = player?.id;
    const slug = generatePlayerSlug(firstName, lastName);
    const payloadWithSlug = { ...payload, slug };

    const supabase = createClient();

    const fullName = `${payload.first_name} ${payload.last_name}`.trim().toLowerCase();
    const { data: existingPlayers } = await supabase
      .from("players")
      .select("id, first_name, last_name")
      .eq("club_id", clubId);

    const isDuplicate = existingPlayers?.some(p => {
      if (player?.id && p.id === player.id) return false;
      const existingFullName = `${p.first_name} ${p.last_name}`.trim().toLowerCase();
      return existingFullName === fullName;
    });

    if (isDuplicate) {
      setError("A player with this name already exists in this club.");
      setSaving(false);
      return;
    }

    if (player?.id) {
      const result = await supabase.from("players").update(payloadWithSlug).eq("id", player.id);
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
    } else {
      const result = await supabase.from("players").insert({ ...payloadWithSlug, club_id: clubId }).select("id").single();
      if (result.error) {
        setError(result.error.message);
        setSaving(false);
        return;
      }
      savedPlayerId = result.data.id;
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
          <Label htmlFor="last-name">Last Name <span className="text-destructive">*</span></Label>
          <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
        </div>
      </div>

      {skillType === 0 ? (
        <div className="space-y-2">
          <Label>Skill Level: {skillLevel}</Label>
          <Slider min={1} max={10} value={[skillLevel]} onValueChange={([v]) => setSkillLevel(v)} />
          <div className="text-xs text-muted-foreground">1 (Beginner) – 10 (Elite)</div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Skill Tier</Label>
          <Select value={skillTierId} onValueChange={setSkillTierId}>
            <SelectTrigger>
              <SelectValue placeholder="Not set" />
            </SelectTrigger>
            <SelectContent>
              {sortedTiers.map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-muted-foreground">Select the tier that best describes player ability</div>
        </div>
      )}

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
