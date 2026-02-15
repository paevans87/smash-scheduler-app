import { redirect } from "next/navigation";
import Link from "next/link";
import { Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PlayerForm } from "@/components/player-form";
import { getClubSubscription } from "@/lib/auth/gates";
import { canAddPlayer } from "@/lib/subscription/restrictions";

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

  const [subscription, { count: playerCount }] = await Promise.all([
    getClubSubscription(club.id),
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id),
  ]);

  const planType = subscription?.planType ?? "free";
  const canAdd = canAddPlayer(playerCount ?? 0, planType);
  const maxPlayers = planType === "pro" ? "unlimited" : "16";

  if (!canAdd) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-6">
        <h1 className="text-3xl font-bold">Add Player</h1>
        <div className="rounded-lg border bg-muted p-6">
          <div className="flex items-start gap-3">
            <Crown className="mt-0.5 size-5 text-amber-500" />
            <div className="space-y-3">
              <div>
                <p className="font-medium">Player limit reached</p>
                <p className="text-sm text-muted-foreground">
                  You have reached the maximum of {maxPlayers} players for your plan.
                  Upgrade to Pro for unlimited players.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/clubs/${clubSlug}/players`}>Back to Players</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-3xl font-bold">Add Player</h1>
      <PlayerForm clubId={club.id} clubSlug={clubSlug} />
    </div>
  );
}
