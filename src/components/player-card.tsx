"use client";

import Link from "next/link";
import { Pencil, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeletePlayerDialog } from "@/components/delete-player-dialog";

type PlayerCardProps = {
  id: string;
  slug: string;
  name: string;
  skillLevel: number | null;
  tierSkillLevel: number | null;
  gender: number;
  clubSlug: string;
  skillType: number;
  onDeleted?: () => void;
};

const genderColours: Record<number, string> = {
  0: "var(--smash-gender-male)",
  1: "var(--smash-gender-female)",
  2: "var(--smash-gender-other)",
};

const tierLabels: Record<number, string> = {
  0: "Lower",
  1: "Middle",
  2: "Upper",
};

const tierColours: Record<number, string> = {
  0: "var(--smash-error)",
  1: "var(--smash-warning)",
  2: "var(--smash-success)",
};

function getSkillColour(level: number): string {
  if (level <= 3) return "var(--smash-error)";
  if (level <= 6) return "var(--smash-warning)";
  if (level <= 9) return "var(--smash-success)";
  return "var(--primary)";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function PlayerCard({ id, slug, name, skillLevel, tierSkillLevel, gender, clubSlug, skillType, onDeleted }: PlayerCardProps) {
  // If in numeric mode, flag when numerical skill is missing; if in tier mode, flag when tier is missing
  const needsAttention = skillType === 0 ? skillLevel == null : tierSkillLevel == null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
        style={{ backgroundColor: genderColours[gender] ?? genderColours[2] }}
      >
        {getInitials(name)}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="truncate font-medium">{name}</span>
        {needsAttention ? (
          <Badge variant="destructive" className="shrink-0 gap-1 text-xs">
            <AlertCircle className="size-3" />
            Needs skill
          </Badge>
        ) : skillType === 0 ? (
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: getSkillColour(skillLevel ?? 5) }}
          >
            {skillLevel}
          </span>
        ) : (
          tierSkillLevel == null ? (
            <Badge className="shrink-0 text-xs font-medium text-white" style={{ backgroundColor: "var(--amber-500)" }}>
              Not set
            </Badge>
          ) : (
            <Badge
              className="shrink-0 text-xs font-medium text-white"
              style={{ backgroundColor: tierColours[tierSkillLevel ?? 1] }}
            >
              {tierLabels[tierSkillLevel ?? 1]}
            </Badge>
          )
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" asChild>
          <Link href={`/clubs/${clubSlug}/players/${slug}/edit`}>
            <Pencil className="size-4" />
          </Link>
        </Button>
        <DeletePlayerDialog playerId={id} playerName={name} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
