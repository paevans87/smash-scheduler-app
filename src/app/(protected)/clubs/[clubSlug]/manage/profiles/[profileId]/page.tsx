import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./edit-profile-form";
import { getClubSubscription } from "@/lib/auth/gates";
import { canUseCustomMatchmakingProfiles } from "@/lib/subscription/restrictions";

type EditProfilePageProps = {
  params: Promise<{ clubSlug: string; profileId: string }>;
};

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const { clubSlug, profileId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
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

  // Fetch profile - check both club-specific and system default profiles
  const { data: clubProfile } = await supabase
    .from("match_making_profiles")
    .select("*")
    .eq("id", profileId)
    .eq("club_id", club.id)
    .single();

  const { data: systemProfile } = !clubProfile
    ? await supabase
        .from("match_making_profiles")
        .select("*")
        .eq("id", profileId)
        .is("club_id", null)
        .single()
    : { data: null };

  const profile = clubProfile ?? systemProfile;

  if (!profile) {
    redirect(`/clubs/${clubSlug}/manage`);
  }

  const subscription = await getClubSubscription(club.id);
  const planType = subscription?.planType ?? "free";
  const canCreateCustomProfiles = canUseCustomMatchmakingProfiles(planType);

  // Custom profiles require Pro subscription
  if (profile.club_id !== null && !profile.is_default && !canCreateCustomProfiles) {
    redirect(`/clubs/${clubSlug}/manage`);
  }

  const isSystemDefault = profile.club_id === null;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        {isSystemDefault ? "View Match Making Profile" : "Edit Match Making Profile"}
      </h1>
      <EditProfileForm
        profile={profile}
        clubId={club.id}
        clubSlug={clubSlug}
        canCreateCustomProfiles={canCreateCustomProfiles}
      />
    </div>
  );
}
