"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SkillMeasurementSectionProps = {
  clubId: string;
  clubSlug: string;
  currentSkillType: number;
};

export function SkillMeasurementSection({ clubId, clubSlug, currentSkillType }: SkillMeasurementSectionProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [skillType, setSkillType] = useState(currentSkillType.toString());

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="skillType">Skill Measurement Type</Label>
        <Select value={skillType} onValueChange={setSkillType}>
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
