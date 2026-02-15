import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewProfileForm } from "../../new-profile-form";
import { getClubSubscription } from "@/lib/auth/gates";
import { canUseCustomMatchmakingProfiles } from "@/lib/subscription/restrictions";

type NewProfilePageProps = {
  params: Promise<{ clubSlug: string }>;
};

export default async function NewProfilePage({ params }: NewProfilePageProps) {
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
    .select("id")
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

  const subscription = await getClubSubscription(club.id);
  const planType = subscription?.planType ?? "free";

  if (!canUseCustomMatchmakingProfiles(planType)) {
    redirect(`/clubs/${clubSlug}/manage`);
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        New Match Making Profile
      </h1>
      <NewProfileForm clubId={club.id} clubSlug={clubSlug} />
    </div>
  );
}
