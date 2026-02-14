"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type MatchMakingProfile = {
  id: string;
  name: string;
  weight_skill_balance: number;
  weight_time_off_court: number;
  weight_match_history: number;
  apply_gender_matching: boolean;
  blacklist_mode: number;
  is_default: boolean;
};

type MatchMakingProfileListProps = {
  profiles: MatchMakingProfile[];
  clubSlug: string;
};

export function MatchMakingProfileList({
  profiles,
  clubSlug,
}: MatchMakingProfileListProps) {
  if (profiles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No match making profiles yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  {profile.is_default && (
                    <Badge variant="default">Default</Badge>
                  )}
                  {profile.apply_gender_matching && (
                    <Badge variant="secondary">Gender Match</Badge>
                  )}
                  {profile.blacklist_mode === 1 && (
                    <Badge variant="destructive">Strict Blacklist</Badge>
                  )}
                </div>
              </div>
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
          </Card>
        </Link>
      ))}
    </div>
  );
}
