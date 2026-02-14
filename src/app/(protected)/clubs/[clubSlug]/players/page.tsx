import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerCard } from "@/components/player-card";

type PlayersPageProps = {
  params: Promise<{ clubSlug: string }>;
};

export default async function PlayersPage({ params }: PlayersPageProps) {
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

  const { data: players } = await supabase
    .from("players")
    .select("id, name, skill_level, gender")
    .eq("club_id", club.id)
    .order("name");

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-3xl font-bold">Players</h1>

      {!players || players.length === 0 ? (
        <p className="text-muted-foreground">
          No players yet. Add your first player to get started.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              id={player.id}
              name={player.name}
              skillLevel={player.skill_level}
              gender={player.gender}
              clubSlug={clubSlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
