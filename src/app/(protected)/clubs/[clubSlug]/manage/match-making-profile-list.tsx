"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type MatchMakingProfile = {
  id: string;
  club_id: string | null;
  name: string;
  weight_skill_balance: number;
  weight_time_off_court: number;
  weight_match_history: number;
  apply_gender_matching: boolean;
  gender_matching_mode: number;
  blacklist_mode: number;
};

type MatchMakingProfileListProps = {
  profiles: MatchMakingProfile[];
  clubSlug: string;
  clubId: string;
  defaultProfileId: string | null;
};

export function MatchMakingProfileList({
  profiles,
  clubSlug,
  clubId,
  defaultProfileId,
}: MatchMakingProfileListProps) {
  const router = useRouter();
  const supabase = createClient();
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  async function handleSetDefault(profileId: string) {
    setSettingDefaultId(profileId);
    try {
      const { error } = await supabase
        .from("clubs")
        .update({ default_matchmaking_profile_id: profileId })
        .eq("id", clubId);
      if (!error) {
        router.refresh();
      }
    } finally {
      setSettingDefaultId(null);
    }
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No match making profiles yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <Link
          key={profile.id}
          href={`/clubs/${clubSlug}/manage/profiles/${profile.id}`}
        >
          <Card className="p-4 transition-colors hover:border-primary">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{profile.name}</h3>
                <div className="flex flex-wrap gap-1">
                  {profile.club_id === null ? (
                    <Badge variant="outline">System</Badge>
                  ) : (
                    <Badge variant="outline">Custom</Badge>
                  )}
                  {profile.id === defaultProfileId && (
                    <Badge variant="default">Default</Badge>
                  )}
                </div>
              </div>
              {profile.id !== defaultProfileId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={settingDefaultId !== null}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSetDefault(profile.id);
                  }}
                >
                  <Star className="mr-1 size-3" />
                  {settingDefaultId === profile.id ? "Setting..." : "Set Default"}
                </Button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="block font-medium text-foreground">
                  {profile.weight_skill_balance}%
                </span>
                Skill
              </div>
              <div>
                <span className="block font-medium text-foreground">
                  {profile.weight_time_off_court}%
                </span>
                Time Off
              </div>
              <div>
                <span className="block font-medium text-foreground">
                  {profile.weight_match_history}%
                </span>
                History
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>
                Gender Match:{" "}
                <span className="font-medium text-foreground">
                  {profile.apply_gender_matching ? "On" : "Off"}
                </span>
              </span>
              <span>
                Gender Mode:{" "}
                <span className="font-medium text-foreground">
                  {profile.gender_matching_mode === 1 ? "Strict" : "Preferred"}
                </span>
              </span>
              <span>
                Blacklist:{" "}
                <span className="font-medium text-foreground">
                  {profile.blacklist_mode === 1 ? "Strict" : "Preferred"}
                </span>
              </span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
