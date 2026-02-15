import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Home, LogOut, Plus, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { canCreateClub } from "@/lib/subscription/restrictions";
import type { PlanType } from "@/lib/subscription/hooks";

type Subscription = { status: string; plan_type: PlanType };

type ClubRow = {
  club_id: string;
  clubs: {
    id: string;
    name: string;
    slug: string;
    subscriptions: Subscription | Subscription[] | null;
  };
};

function toArray(subs: Subscription | Subscription[] | null): Subscription[] {
  if (!subs) return [];
  return Array.isArray(subs) ? subs : [subs];
}

function subscriptionLabel(status: string, planType: PlanType): string {
  if (status === "trialling") return "Trial";
  if (planType === "free") return "Free";
  return "Pro";
}

function hasProSubscription(clubs: ClubRow[]): boolean {
  return clubs.some((row) =>
    toArray(row.clubs.subscriptions).some(
      (s) =>
        (s.status === "active" || s.status === "trialling") &&
        s.plan_type === "pro"
    )
  );
}

export default async function ClubsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("club_organisers")
    .select("club_id, clubs:club_id(id, name, slug, subscriptions(status, plan_type))")
    .eq("user_id", user.id);

  const clubs = (data as unknown as ClubRow[]) ?? [];

  const activeClubs = clubs.filter((row) =>
    toArray(row.clubs.subscriptions).some(
      (s) => s.status === "active" || s.status === "trialling"
    )
  );

  const userHasPro = hasProSubscription(activeClubs);
  const canCreateMoreClubs = canCreateClub(activeClubs.length, userHasPro ? "pro" : "free");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon-192.png"
            alt="SmashScheduler"
            width={32}
            height={32}
            className="shrink-0"
          />
          <span className="text-lg font-semibold">SmashScheduler</span>
        </Link>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Home className="size-4" />
                <span className="ml-2 hidden sm:inline">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/">
                  <Home className="mr-2 size-4" />
                  Home
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <form action="/logout" method="post">
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <h1 className="text-3xl font-bold">Select a Club</h1>
        <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          {activeClubs.map((row) => {
            const activeSub = toArray(row.clubs.subscriptions).find(
              (s) => s.status === "active" || s.status === "trialling"
            );

            return (
              <Link key={row.club_id} href={`/clubs/${row.clubs.slug}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardHeader>
                    <CardTitle>{row.clubs.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeSub && (
                      <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {subscriptionLabel(activeSub.status, activeSub.plan_type)}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
          {canCreateMoreClubs ? (
            <Link href="/pricing">
              <Card className="flex h-full min-h-[120px] items-center justify-center transition-colors hover:border-primary">
                <CardContent className="flex flex-col items-center gap-2 py-6">
                  <Plus className="size-8 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">Create a Club</span>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="flex h-full min-h-[120px] items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <Crown className="size-8" />
                <span className="font-medium">Upgrade to Pro</span>
                <span className="text-xs text-center">Create unlimited clubs</span>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
