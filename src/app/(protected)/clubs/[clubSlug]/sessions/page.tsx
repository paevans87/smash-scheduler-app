import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionsList } from "./sessions-list";

type SessionsPageProps = {
  params: Promise<{ clubSlug: string }>;
};

export default async function SessionsPage({ params }: SessionsPageProps) {
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

  return (
    <div className="p-6">
      <SessionsList clubSlug={clubSlug} clubId={club.id} />
    </div>
  );
}
