"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Plus, Trash2, GripVertical } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

type SkillTier = {
  id: string;
  club_id: string | null;
  name: string;
  score: number;
  display_order: number;
};

type SkillMeasurementSectionProps = {
  clubId: string;
  clubSlug: string;
  currentSkillType: number;
  playerCount: number;
  defaultTiers: SkillTier[];
  clubTiers: SkillTier[];
  canCreateCustomTiers: boolean;
};

export function SkillMeasurementSection({
  clubId,
  clubSlug,
  currentSkillType,
  playerCount,
  defaultTiers,
  clubTiers: initialClubTiers,
  canCreateCustomTiers,
}: SkillMeasurementSectionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [skillType, setSkillType] = useState(currentSkillType.toString());
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSkillType, setPendingSkillType] = useState<string | null>(null);

  // Custom tiers state
  const [clubTiers, setClubTiers] = useState<SkillTier[]>(initialClubTiers);
  const [showAddTier, setShowAddTier] = useState(false);
  const [newTierName, setNewTierName] = useState("");
  const [newTierScore, setNewTierScore] = useState("");
  const [tierSaving, setTierSaving] = useState(false);
  const [tierError, setTierError] = useState<string | null>(null);

  const hasPlayers = playerCount > 0;
  const hasCustomTiers = clubTiers.length > 0;
  const displayTiers = hasCustomTiers ? clubTiers : defaultTiers;

  function handleSkillTypeChange(value: string) {
    if (hasPlayers && value !== currentSkillType.toString()) {
      setPendingSkillType(value);
      setShowConfirm(true);
    } else {
      setSkillType(value);
    }
  }

  function handleConfirmCancel() {
    setShowConfirm(false);
    setPendingSkillType(null);
  }

  function handleConfirmProceed() {
    if (pendingSkillType) {
      setSkillType(pendingSkillType);
    }
    setShowConfirm(false);
    setPendingSkillType(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("clubs")
        .update({
          skill_type: parseInt(skillType),
        })
        .eq("id", clubId);

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

  async function handleAddTier() {
    const trimmedName = newTierName.trim();
    const score = parseInt(newTierScore);

    if (!trimmedName) {
      setTierError("Tier name is required.");
      return;
    }
    if (isNaN(score) || score < 0 || score > 1000) {
      setTierError("Score must be between 0 and 1000.");
      return;
    }

    setTierSaving(true);
    setTierError(null);

    try {
      const nextOrder = clubTiers.length > 0
        ? Math.max(...clubTiers.map((t) => t.display_order)) + 1
        : 0;

      const { data, error } = await supabase
        .from("club_skill_tiers")
        .insert({
          club_id: clubId,
          name: trimmedName,
          score,
          display_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;

      setClubTiers((prev) => [...prev, data as SkillTier]);
      setNewTierName("");
      setNewTierScore("");
      setShowAddTier(false);
      router.refresh();
    } catch {
      setTierError("Failed to add tier.");
    } finally {
      setTierSaving(false);
    }
  }

  async function handleDeleteTier(tierId: string) {
    try {
      const { error } = await supabase
        .from("club_skill_tiers")
        .delete()
        .eq("id", tierId);

      if (error) throw error;

      setClubTiers((prev) => prev.filter((t) => t.id !== tierId));
      router.refresh();
    } catch {
      // error handled silently
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="skillType">Skill Measurement Type</Label>
          <Select value={skillType} onValueChange={handleSkillTypeChange}>
            <SelectTrigger id="skillType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Numerical Skill Gauge (1–10)</SelectItem>
              <SelectItem value="1">Tier Skill Gauge (Lower, Middle, Upper)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Choose how player skill levels are measured and displayed across your club
          </p>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading || skillType === currentSkillType.toString()}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Tier list - shown when skill type is Tier */}
      {skillType === "1" && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              {hasCustomTiers ? "Custom Tiers" : "Default Tiers"}
            </h4>
            {canCreateCustomTiers ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddTier(true)}
              >
                <Plus className="mr-1 size-3" />
                Add Tier
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Crown className="size-4 text-amber-500" />
                  <span className="text-xs">Pro feature</span>
                </div>
                <Button type="button" variant="outline" size="sm" disabled>
                  <Plus className="mr-1 size-3" />
                  Add Tier
                </Button>
              </div>
            )}
          </div>

          {!canCreateCustomTiers && !hasCustomTiers && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
              <Crown className="size-4 shrink-0 text-amber-500" />
              <p className="text-amber-800 dark:text-amber-200">
                Custom tiers are a Pro feature.{" "}
                <Link
                  href={`/upgrade?club=${clubSlug}`}
                  className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                >
                  Upgrade to create your own tiers
                </Link>
              </p>
            </div>
          )}

          <div className="space-y-2">
            {displayTiers
              .sort((a, b) => a.display_order - b.display_order)
              .map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    {hasCustomTiers && (
                      <GripVertical className="size-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">{tier.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Score: {tier.score}
                    </span>
                  </div>
                  {tier.club_id !== null && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteTier(tier.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Confirmation dialog for skill type change */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Skill Measurement Change</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Changing the skill measurement type will require you to re-set skill
            levels for all {playerCount} player{playerCount !== 1 ? "s" : ""}. Do
            you want to proceed?
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleConfirmCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmProceed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add custom tier dialog */}
      <Dialog open={showAddTier} onOpenChange={setShowAddTier}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Tier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {tierError && (
              <p className="text-sm text-destructive">{tierError}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="tierName">Tier Name</Label>
              <Input
                id="tierName"
                value={newTierName}
                onChange={(e) => setNewTierName(e.target.value)}
                placeholder="e.g. Intermediate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tierScore">Score</Label>
              <Input
                id="tierScore"
                type="number"
                min={0}
                max={1000}
                value={newTierScore}
                onChange={(e) => setNewTierScore(e.target.value)}
                placeholder="e.g. 50"
              />
              <p className="text-xs text-muted-foreground">
                Used for matchmaking algorithms. Higher scores indicate higher skill.
              </p>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleAddTier} disabled={tierSaving}>
              {tierSaving ? "Adding..." : "Add Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
