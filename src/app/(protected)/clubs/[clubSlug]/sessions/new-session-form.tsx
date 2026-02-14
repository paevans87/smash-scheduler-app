"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOnlineStatus } from "@/lib/offline/online-status-provider";
import { enqueuePendingChange } from "@/lib/offline/pending-changes";
import { cacheSession } from "@/lib/offline/sync-service";

type NewSessionPageProps = {
  clubId: string;
  clubSlug: string;
  defaultCourtCount: number;
};

function generateSessionSlug(date: Date, suffix: number = 0): string {
  const base = date.toISOString().split('T')[0];
  return suffix === 0 ? base : `${base}-${suffix}`;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

export function NewSessionForm({
  clubId,
  clubSlug,
  defaultCourtCount,
}: NewSessionPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const { isOnline } = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("19:00");
  const [courtCount, setCourtCount] = useState(defaultCourtCount);

  const isValid = date && time && courtCount >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setIsLoading(true);

    try {
      const [hours, minutes] = time.split(":").map(Number);
      const scheduledDateTime = new Date(date);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const sessionId = generateUUID();
      const slug = generateSessionSlug(scheduledDateTime);

      const sessionData = {
        id: sessionId,
        club_id: clubId,
        scheduled_date_time: scheduledDateTime.toISOString(),
        court_count: courtCount,
        state: 0,
        slug,
      };

      if (isOnline) {
        const { error } = await supabase.from("sessions").insert(sessionData);
        if (error) throw error;
      }

      await cacheSession(sessionData);
      await enqueuePendingChange({
        table: "sessions",
        operation: "insert",
        payload: sessionData,
      });

      router.push(`/clubs/${clubSlug}/sessions/${sessionId}/draft`);
      router.refresh();
    } catch {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>
            Set the date, time and court count for your session
            {!isOnline && (
              <span className="block mt-2 text-amber-600">
                You are offline. The session will be created locally and synced when you are back online.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courts">Number of Courts</Label>
            <Input
              id="courts"
              type="number"
              min={1}
              max={20}
              value={courtCount}
              onChange={(e) => setCourtCount(parseInt(e.target.value) || 1)}
              required
            />
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-4">
        <Button type="submit" disabled={!isValid || isLoading}>
          {isLoading ? "Creating..." : "Create Draft Session"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/clubs/${clubSlug}/sessions`)}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </form>
    </div>
  );
}
