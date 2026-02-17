import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerEditClient } from "@/components/player-edit-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EditPlayerPageProps = {
  params: Promise<{ clubSlug: string; playerSlug: string }>;
};

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const { clubSlug, playerSlug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, skill_type")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("club_id", club.id)
    .eq("slug", playerSlug)
    .single();

  if (!player) {
    redirect(`/clubs/${clubSlug}/players`);
  }

  return <PlayerEditClient clubId={club.id} clubSlug={clubSlug} playerId={player.id} playerSlug={playerSlug} skillType={club.skill_type} />;
}
