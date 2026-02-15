"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
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
import { canScheduleSession } from "@/lib/subscription/restrictions";
import type { PlanType } from "@/lib/subscription/hooks";

type NewSessionPageProps = {
  clubId: string;
  clubSlug: string;
  defaultCourtCount: number;
  planType: PlanType;
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
  planType,
}: NewSessionPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const { isOnline } = useOnlineStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("19:00");
  const [courtCount, setCourtCount] = useState(defaultCourtCount);

  function validateSchedule(): boolean {
    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDateTime = new Date(date);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    if (!canScheduleSession(scheduledDateTime, planType)) {
      setValidationError(
        planType === "free"
          ? "Free plans can only schedule sessions up to 7 days in advance. Upgrade to Pro for unlimited scheduling."
          : "Invalid schedule date."
      );
      return false;
    }

    setValidationError(null);
    return true;
  }

  const isValid = date && time && courtCount >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    if (!validateSchedule()) return;

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

  const maxScheduleDays = planType === "pro" ? "unlimited" : "7 days";

  return (
    <div className="max-w-md space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
          <CardDescription>
            Set the date, time and court count for your session.
            <span className="block mt-1 text-xs">
              Schedule up to {maxScheduleDays} in advance
              {planType === "free" && <Crown className="inline size-3 ml-1 text-amber-500" />}
            </span>
            {!isOnline && (
              <span className="block mt-2 text-amber-600">
                You are offline. The session will be created locally and synced when you are back online.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {validationError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {validationError}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              min={today}
              onChange={(e) => {
                setDate(e.target.value);
                if (validationError) validateSchedule();
              }}
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
