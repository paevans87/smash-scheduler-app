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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Crown, Trash2 } from "lucide-react";
import Link from "next/link";

type Profile = {
  id: string;
  club_id: string | null;
  name: string;
  weight_skill_balance: number;
  weight_time_off_court: number;
  weight_match_history: number;
  apply_gender_matching: boolean;
  blacklist_mode: number;
  is_default: boolean;
};

type EditProfileFormProps = {
  profile: Profile;
  clubId: string;
  clubSlug: string;
  canCreateCustomProfiles: boolean;
};

export function EditProfileForm({ profile, clubId, clubSlug, canCreateCustomProfiles }: EditProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const isSystemDefault = profile.club_id === null;

  const [name, setName] = useState(profile.name);
  const [skillWeight, setSkillWeight] = useState(profile.weight_skill_balance);
  const [timeOffWeight, setTimeOffWeight] = useState(profile.weight_time_off_court);
  const [historyWeight, setHistoryWeight] = useState(profile.weight_match_history);
  const [applyGenderMatching, setApplyGenderMatching] = useState(profile.apply_gender_matching);
  const [blacklistMode, setBlacklistMode] = useState(profile.blacklist_mode.toString());
  const [isDefault, setIsDefault] = useState(profile.is_default);

  const totalWeight = skillWeight + timeOffWeight + historyWeight;
  const isValid = totalWeight === 100 && name.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);

    try {
      if (isDefault && !profile.is_default) {
        await supabase
          .from("match_making_profiles")
          .update({ is_default: false })
          .eq("club_id", clubId);
      }

      const { error } = await supabase
        .from("match_making_profiles")
        .update({
          name: name.trim(),
          weight_skill_balance: skillWeight,
          weight_time_off_court: timeOffWeight,
          weight_match_history: historyWeight,
          apply_gender_matching: applyGenderMatching,
          blacklist_mode: parseInt(blacklistMode),
          is_default: isDefault,
        })
        .eq("id", profile.id);

      if (error) {
        throw error;
      }

      router.push(`/clubs/${clubSlug}/manage`);
      router.refresh();
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("match_making_profiles")
        .delete()
        .eq("id", profile.id);

      if (error) throw error;

      router.push(`/clubs/${clubSlug}/manage`);
      router.refresh();
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {isSystemDefault && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
          <Crown className="size-4 shrink-0 text-amber-500" />
          <p className="text-amber-800 dark:text-amber-200">
            This is a system profile and cannot be changed.{" "}
            {canCreateCustomProfiles ? (
              <Link
                href={`/clubs/${clubSlug}/manage/profiles/new`}
                className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
              >
                Create your own profile
              </Link>
            ) : (
              <Link
                href="/pricing"
                className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
              >
                Upgrade to Pro to create custom profiles
              </Link>
            )}
          </p>
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Name your match making profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Profile Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Competitive, Social, Balanced"
              required
              disabled={isSystemDefault}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={isDefault}
              onCheckedChange={(checked: boolean | "indeterminate") => setIsDefault(checked === true)}
              disabled={isSystemDefault}
            />
            <Label htmlFor="isDefault" className="font-normal">
              Set as default profile
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Match Making Weights</CardTitle>
          <CardDescription>
            Adjust the weighting factors (must total 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Player Skill Level</Label>
              <span className="text-sm font-medium">{skillWeight}%</span>
            </div>
            <Slider
              value={[skillWeight]}
              onValueChange={(value) => setSkillWeight(value[0])}
              min={0}
              max={100}
              step={1}
              disabled={isSystemDefault}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Time Sat Off Court</Label>
              <span className="text-sm font-medium">{timeOffWeight}%</span>
            </div>
            <Slider
              value={[timeOffWeight]}
              onValueChange={(value) => setTimeOffWeight(value[0])}
              min={0}
              max={100}
              step={1}
              disabled={isSystemDefault}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Match History</Label>
              <span className="text-sm font-medium">{historyWeight}%</span>
            </div>
            <Slider
              value={[historyWeight]}
              onValueChange={(value) => setHistoryWeight(value[0])}
              min={0}
              max={100}
              step={1}
              disabled={isSystemDefault}
            />
          </div>

          <div
            className={`flex items-center justify-between rounded-md p-3 ${
              totalWeight === 100
                ? "bg-green-50 text-green-700"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            <span className="text-sm font-medium">
              Total Weight: {totalWeight}%
            </span>
            {totalWeight !== 100 && (
              <span className="text-xs">Must equal 100%</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Options</CardTitle>
          <CardDescription>Configure additional match making rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="genderMatching"
              checked={applyGenderMatching}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                setApplyGenderMatching(checked === true)
              }
              disabled={isSystemDefault}
            />
            <div className="space-y-1">
              <Label htmlFor="genderMatching" className="font-normal">
                Apply Gender Matching
              </Label>
              <p className="text-xs text-muted-foreground">
                Ensures games are either male + female vs male + female, or all
                same gender
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="blacklistMode">Blacklist Mode</Label>
            <Select value={blacklistMode} onValueChange={setBlacklistMode} disabled={isSystemDefault}>
              <SelectTrigger id="blacklistMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Preferred (soft)</SelectItem>
                <SelectItem value="1">Strict (hard)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Preferred: Avoid blacklisted pairings when possible. Strict: Never
              match blacklisted players.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        {!isSystemDefault ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Profile
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this profile? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div />
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/clubs/${clubSlug}/manage`)}
            disabled={isLoading}
          >
            {isSystemDefault ? "Back" : "Cancel"}
          </Button>
          {!isSystemDefault && (
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
