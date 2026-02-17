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
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useCallback } from "react";

type Session = {
  id: string;
  club_id: string;
  slug: string;
  scheduled_date_time: string;
  court_count: number;
  state: number;
};

type UseSessionsResult = {
  sessions: Session[];
  isLoading: boolean;
  mutate: () => void;
};

function useSessions(clubId: string): UseSessionsResult {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revalidateKey, setRevalidateKey] = useState(0);

  const mutate = useCallback(() => {
    setRevalidateKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);

      const supabase = createClient();
      const { data } = await supabase
        .from("sessions")
        .select("id, club_id, slug, scheduled_date_time, court_count, state")
        .eq("club_id", clubId)
        .order("scheduled_date_time", { ascending: false });

      if (!cancelled && data) {
        setSessions(data);
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [clubId, revalidateKey]);

  return { sessions, isLoading, mutate };
}

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
  const { sessions, isLoading } = useSessions(clubId);

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
