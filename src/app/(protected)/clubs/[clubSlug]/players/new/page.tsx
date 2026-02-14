import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerForm } from "@/components/player-form";

type NewPlayerPageProps = {
  params: Promise<{ clubSlug: string }>;
};

export default async function NewPlayerPage({ params }: NewPlayerPageProps) {
  const { clubSlug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-3xl font-bold">Add Player</h1>
      <PlayerForm clubId={club.id} clubSlug={clubSlug} />
    </div>
  );
}
