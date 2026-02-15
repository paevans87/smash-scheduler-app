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

  const { data: profile } = await supabase
    .from("match_making_profiles")
    .select("*")
    .eq("id", profileId)
    .eq("club_id", club.id)
    .single();

  if (!profile) {
    redirect(`/clubs/${clubSlug}/manage`);
  }

  const subscription = await getClubSubscription(club.id);
  const planType = subscription?.planType ?? "free";

  if (!profile.is_default && !canUseCustomMatchmakingProfiles(planType)) {
    redirect(`/clubs/${clubSlug}/manage`);
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Edit Match Making Profile
      </h1>
      <EditProfileForm profile={profile} clubId={club.id} clubSlug={clubSlug} />
    </div>
  );
}
