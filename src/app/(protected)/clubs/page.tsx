import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut, Plus, Crown, AlertTriangle, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { canCreateClub } from "@/lib/subscription/restrictions";
import { ThemeToggle } from "@/components/theme-toggle";
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

function badgeClasses(status: string, planType: PlanType): string {
  if (status === "trialling")
    return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
  if (planType === "pro")
    return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
  return "bg-muted text-muted-foreground";
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

  const lapsedClubs = clubs.filter((row) =>
    toArray(row.clubs.subscriptions).some(
      (s) => s.status === "cancelled" || s.status === "expired"
    )
  );

  const userHasPro = hasProSubscription(activeClubs);
  const canCreateMoreClubs = canCreateClub(activeClubs.length, userHasPro ? "pro" : "free");

  const freeClub = activeClubs.find((row) =>
    toArray(row.clubs.subscriptions).some(
      (s) => (s.status === "active" || s.status === "trialling") && s.plan_type === "free"
    )
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-green-50 via-white to-green-100/30 px-4 py-12 dark:from-background dark:via-background dark:to-background">
      {/* Decorative background blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/icon-192.png"
            alt="SmashScheduler"
            width={56}
            height={56}
            className="shrink-0 drop-shadow-md"
          />
          <h1 className="text-2xl font-bold tracking-tight">SmashScheduler</h1>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-xl font-semibold">Your Clubs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a club to manage, or create a new one.
          </p>
        </div>

        {/* Club list */}
        <div className="flex w-full flex-col gap-3">
          {activeClubs.map((row) => {
            const activeSub = toArray(row.clubs.subscriptions).find(
              (s) => s.status === "active" || s.status === "trialling"
            );

            return (
              <Link key={row.club_id} href={`/clubs/${row.clubs.slug}`}>
                <Card className="group border bg-white/80 backdrop-blur-sm transition-all hover:border-primary hover:shadow-md dark:bg-card/80">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-lg font-bold">
                        {row.clubs.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{row.clubs.name}</p>
                      {activeSub && (
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClasses(activeSub.status, activeSub.plan_type)}`}
                        >
                          {subscriptionLabel(activeSub.status, activeSub.plan_type)}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {lapsedClubs.map((row) => {
            const lapsedSub = toArray(row.clubs.subscriptions).find(
              (s) => s.status === "cancelled" || s.status === "expired"
            );

            return (
              <Link key={row.club_id} href={`/subscription-lapsed?club=${row.clubs.slug}`}>
                <Card className="group border-red-200 bg-white/80 backdrop-blur-sm transition-all hover:border-red-400 hover:shadow-md dark:border-red-900 dark:bg-card/80 dark:hover:border-red-700">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
                      <AlertTriangle className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{row.clubs.name}</p>
                      <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                        {lapsedSub?.status === "expired" ? "Payment failed" : "Cancelled"}
                      </span>
                    </div>
                    <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {/* Create / Upgrade */}
          {canCreateMoreClubs ? (
            <Link href="/pricing">
              <Card className="group border-dashed border-2 bg-white/50 backdrop-blur-sm transition-all hover:border-primary hover:bg-white/80 hover:shadow-md dark:bg-card/50 dark:hover:bg-card/80">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Plus className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                      Create a Club
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Set up a new badminton club
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ) : freeClub ? (
            <Link href={`/upgrade?club=${freeClub.clubs.slug}`}>
              <Card className="group border-dashed border-2 border-amber-200 bg-amber-50/50 backdrop-blur-sm transition-all hover:border-amber-400 hover:shadow-md dark:border-amber-900 dark:bg-amber-950/20 dark:hover:border-amber-700">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    <Crown className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800 dark:text-amber-200">
                      Upgrade to Pro
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Create unlimited clubs
                    </p>
                  </div>
                  <ChevronRight className="size-5 text-amber-400 transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="border-dashed border-2 border-amber-200 bg-amber-50/50 backdrop-blur-sm dark:border-amber-900 dark:bg-amber-950/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Crown className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    Upgrade to Pro
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Create unlimited clubs
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sign out & theme */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action="/logout" method="post">
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
