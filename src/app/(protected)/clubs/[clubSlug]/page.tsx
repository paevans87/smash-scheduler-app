import { redirect } from "next/navigation";
import { Users, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardPageProps = {
  params: Promise<{ clubSlug: string }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ClubDashboardPage({ params }: DashboardPageProps) {
  const { clubSlug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  const [{ count: memberCount }, { data: nextSession }] = await Promise.all([
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id),
    supabase
      .from("sessions")
      .select("scheduled_date_time")
      .eq("club_id", club.id)
      .gte("scheduled_date_time", new Date().toISOString())
      .order("scheduled_date_time", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className="space-y-6 px-4 py-6 md:px-6">
      <h1 className="text-3xl font-bold">{club.name}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Session</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {nextSession
                ? dateFormatter.format(new Date(nextSession.scheduled_date_time))
                : "No upcoming sessions"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
