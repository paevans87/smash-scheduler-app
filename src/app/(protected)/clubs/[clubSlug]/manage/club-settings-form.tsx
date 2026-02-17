"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Club = {
  id: string;
  name: string;
  default_court_count: number;
  game_type: number;
  skill_type: number;
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
  const [skillType, setSkillType] = useState(club.skill_type.toString());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSkillType, setPendingSkillType] = useState<number | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  const isValid = name.trim() !== "" && defaultCourtCount >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    // If skill type would change, show confirmation dialog
    const newSkillType = parseInt(skillType);
    if (newSkillType !== club.skill_type) {
      setPendingSkillType(newSkillType);
      setConfirmOpen(true);
      // open dialog via hidden trigger
      requestAnimationFrame(() => confirmBtnRef.current?.click());
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("clubs")
        .update({
          name: name.trim(),
          default_court_count: defaultCourtCount,
          game_type: parseInt(gameType),
          skill_type: parseInt(skillType),
        })
        .eq("id", club.id);

      if (error) {
        throw error;
      }

      router.refresh();
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmSkillTypeChange() {
    // Commit the pending skill type change
    if (pendingSkillType == null) return;
    setConfirmOpen(false);
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("clubs")
        .update({
          name: name.trim(),
          default_court_count: defaultCourtCount,
          game_type: parseInt(gameType),
          skill_type: pendingSkillType,
        })
        .eq("id", club.id);
      if (error) throw error;
      router.refresh();
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
      setPendingSkillType(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button ref={confirmBtnRef} className="sr-only" aria-label="confirm-skill-change" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Skill Measurement Change</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Changing the skill measurement type will require updating all players' skill data. This may affect how players are displayed and filtered. Do you want to proceed?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { await confirmSkillTypeChange(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="space-y-4">
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
      </div>

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
