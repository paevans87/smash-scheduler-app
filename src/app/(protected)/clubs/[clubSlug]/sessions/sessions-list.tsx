"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSessions } from "@/lib/offline/use-sessions";

type SessionsListProps = {
  clubSlug: string;
  clubId: string;
};

function getStateBadge(state: number) {
  switch (state) {
    case 0:
      return <Badge variant="secondary">Draft</Badge>;
    case 1:
      return <Badge variant="default">Active</Badge>;
    case 2:
      return <Badge variant="outline">Complete</Badge>;
    default:
      return <Badge variant="secondary">Draft</Badge>;
  }
}

function getStateLabel(state: number) {
  switch (state) {
    case 0:
      return "draft";
    case 1:
      return "active";
    case 2:
      return "complete";
    default:
      return "draft";
  }
}

export function SessionsList({ clubSlug, clubId }: SessionsListProps) {
  const { sessions, isLoading, isStale } = useSessions(clubId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
            <p className="text-muted-foreground">Manage your club sessions</p>
          </div>
        </div>
        <div className="text-center py-12">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">
            Manage your club sessions
            {isStale && (
              <span className="ml-2 text-amber-600">
                (Showing cached data — changes will sync when you are back online)
              </span>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href={`/clubs/${clubSlug}/sessions/new`}>
            <Plus className="mr-2 size-4" />
            New Session
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session) => {
          const date = new Date(session.scheduled_date_time);

          return (
            <Link
              key={session.id}
              href={`/clubs/${clubSlug}/sessions/${session.id}/${getStateLabel(session.state)}`}
            >
              <Card className="transition-colors hover:border-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {date.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </CardTitle>
                  {getStateBadge(session.state)}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {date.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{session.court_count}</strong> courts
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No sessions yet. Create your first session to get started.
        </div>
      )}
    </div>
  );
}
