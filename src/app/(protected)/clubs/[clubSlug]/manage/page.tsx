import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { MatchMakingProfileList } from "./match-making-profile-list";
import { ClubSettingsForm } from "./club-settings-form";

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

type Club = {
  id: string;
  name: string;
  default_court_count: number;
  game_type: number;
};

type ClubManagementPageProps = {
  params: Promise<{ clubSlug: string }>;
};

export default async function ClubManagementPage({
  params,
}: ClubManagementPageProps) {
  const { clubSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name, default_court_count, game_type")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/clubs");
  }

  const { data: profiles } = await supabase
    .from("match_making_profiles")
    .select("*")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Club Management</h1>
          <p className="text-muted-foreground">
            Manage your club settings and match making profiles
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Club Settings</CardTitle>
          <CardDescription>
            Update your club name, default courts, and game type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClubSettingsForm club={club as Club} clubSlug={clubSlug} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Match Making Profiles</CardTitle>
            <CardDescription>
              Create profiles with different weightings for match making
            </CardDescription>
          </div>
          <Button asChild>
            <Link href={`/clubs/${clubSlug}/manage/profiles/new`}>
              <Plus className="mr-2 size-4" />
              New Profile
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <MatchMakingProfileList
            profiles={(profiles as MatchMakingProfile[]) ?? []}
            clubSlug={clubSlug}
          />
        </CardContent>
      </Card>
    </div>
  );
}
