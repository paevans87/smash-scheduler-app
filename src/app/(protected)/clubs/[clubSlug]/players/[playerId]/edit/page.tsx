import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerEditClient } from "@/components/player-edit-client";

type EditPlayerPageProps = {
  params: Promise<{ clubSlug: string; playerId: string }>;
};

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const { clubSlug, playerId } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  return <PlayerEditClient clubId={club.id} clubSlug={clubSlug} playerId={playerId} />;
}
