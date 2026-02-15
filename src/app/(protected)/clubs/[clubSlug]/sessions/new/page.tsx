import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewSessionForm } from "../new-session-form";
import { getClubSubscription } from "@/lib/auth/gates";

type NewSessionPageProps = {
  params: Promise<{ clubSlug: string }>;
};

export default async function NewSessionPage({ params }: NewSessionPageProps) {
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
    .select("id, default_court_count")
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">New Session</h1>
      <NewSessionForm
        clubId={club.id}
        clubSlug={clubSlug}
        defaultCourtCount={club.default_court_count}
        planType={subscription?.planType ?? "free"}
      />
    </div>
  );
}
