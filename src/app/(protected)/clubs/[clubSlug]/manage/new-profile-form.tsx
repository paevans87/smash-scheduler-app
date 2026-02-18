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

type NewProfilePageProps = {
  clubId: string;
  clubSlug: string;
};

export function NewProfileForm({ clubId, clubSlug }: NewProfilePageProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [skillWeight, setSkillWeight] = useState(40);
  const [timeOffWeight, setTimeOffWeight] = useState(35);
  const [historyWeight, setHistoryWeight] = useState(25);
  const [applyGenderMatching, setApplyGenderMatching] = useState(false);
  const [genderMatchingMode, setGenderMatchingMode] = useState("0");
  const [blacklistMode, setBlacklistMode] = useState("0");

  const totalWeight = skillWeight + timeOffWeight + historyWeight;
  const isValid = totalWeight === 100 && name.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from("match_making_profiles").insert({
        club_id: clubId,
        name: name.trim(),
        weight_skill_balance: skillWeight,
        weight_time_off_court: timeOffWeight,
        weight_match_history: historyWeight,
        apply_gender_matching: applyGenderMatching,
        gender_matching_mode: parseInt(genderMatchingMode),
        blacklist_mode: parseInt(blacklistMode),
      });

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

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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
            />
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
          <CardTitle>Gender Matching Options</CardTitle>
          <CardDescription>Configure gender matching rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="genderMatching"
              checked={applyGenderMatching}
              onCheckedChange={(checked: boolean | "indeterminate") =>
                setApplyGenderMatching(checked === true)
              }
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
            <Label htmlFor="genderMatchingMode">Gender Matching Mode</Label>
            <Select value={genderMatchingMode} onValueChange={setGenderMatchingMode}>
              <SelectTrigger id="genderMatchingMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Preferred (soft)</SelectItem>
                <SelectItem value="1">Strict (hard)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Preferred: Avoid gender mismatches when possible. Strict: Never create gender mismatched games.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Blacklist Options</CardTitle>
          <CardDescription>Configure blacklist handling rules</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="blacklistMode">Blacklist Mode</Label>
            <Select value={blacklistMode} onValueChange={setBlacklistMode}>
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

      <div className="flex gap-4">
        <Button type="submit" disabled={!isValid || isLoading}>
          {isLoading ? "Creating..." : "Create Profile"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/clubs/${clubSlug}/manage`)}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
