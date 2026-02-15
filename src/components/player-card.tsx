"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeletePlayerDialog } from "@/components/delete-player-dialog";

type PlayerCardProps = {
  id: string;
  name: string;
  skillLevel: number;
  gender: number;
  clubSlug: string;
  onDeleted?: () => void;
};

const genderColours: Record<number, string> = {
  0: "var(--smash-gender-male)",
  1: "var(--smash-gender-female)",
  2: "var(--smash-gender-other)",
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

export function PlayerCard({ id, name, skillLevel, gender, clubSlug, onDeleted }: PlayerCardProps) {
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
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: getSkillColour(skillLevel) }}
        >
          {skillLevel}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" asChild>
          <Link href={`/clubs/${clubSlug}/players/${id}/edit`}>
            <Pencil className="size-4" />
          </Link>
        </Button>
        <DeletePlayerDialog playerId={id} playerName={name} onDeleted={onDeleted} />
      </div>
    </div>
  );
}
