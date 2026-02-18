"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { seedSession, seedSessionPlayers, seedCourtLabels } from "@/lib/db/index";
import { enqueueMutation, processQueue } from "@/lib/db/sync";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart2,
  Armchair,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Check,
  Activity,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";

type Player = {
  id: string;
  name: string | null;
  gender: number;
};

type SessionPlayer = {
  player_id: string;
  is_active: boolean;
  player?: Player;
};

type CourtLabel = {
  court_number: number;
  label: string;
};

type Session = {
  id: string;
  scheduled_date_time: string;
  court_count: number;
  state: number;
};

type SortField = "name" | "games" | "time";
type SortDir = "asc" | "desc";

const genderColours: Record<number, string> = {
  0: "var(--smash-gender-male)",
  1: "var(--smash-gender-female)",
};

type Props = {
  sessionId: string;
  clubSlug: string;
  session: Session;
  sessionPlayers: SessionPlayer[];
  courtLabels: CourtLabel[];
};

export function ActiveSessionClient({
  sessionId,
  clubSlug,
  session,
  sessionPlayers,
  courtLabels,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [isEnding, setIsEnding] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const { isOnline, pendingCount, isSyncing } = useSyncStatus();

  // Seed IndexedDB on mount so data is available if connection drops
  useEffect(() => {
    seedSession({
      id: session.id,
      club_id: "", // not needed for offline ops, already have sessionId
      scheduled_date_time: session.scheduled_date_time,
      court_count: session.court_count,
      state: session.state,
    });
    seedSessionPlayers(
      sessionId,
      sessionPlayers.map((sp) => ({ player_id: sp.player_id, is_active: sp.is_active }))
    );
    seedCourtLabels(sessionId, courtLabels);
  }, [session, sessionId, sessionPlayers, courtLabels]);

  // Once back online after ending session offline, navigate away
  useEffect(() => {
    if (sessionEnded && isOnline && pendingCount === 0) {
      router.push(`/clubs/${clubSlug}/sessions`);
      router.refresh();
    }
  }, [sessionEnded, isOnline, pendingCount, clubSlug, router]);

  const scheduledDate = new Date(session.scheduled_date_time);
  const activePlayers = sessionPlayers.filter((sp) => sp.is_active && sp.player);
  const courtCount = session.court_count;
  const courts = Array.from({ length: courtCount }, (_, i) => i + 1);

  const nPlaying = 0;
  const nCompleted = 0;
  const nInProgress = 0;
  const benchPlayers = activePlayers;

  function getCourtName(num: number) {
    const label = courtLabels.find((cl) => cl.court_number === num);
    return label?.label || `Court ${num}`;
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  const sortedPlayers = [...activePlayers].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortField === "name") {
      return (a.player?.name ?? "").localeCompare(b.player?.name ?? "") * dir;
    }
    return 0;
  });

  async function handleEndSession() {
    setIsEnding(true);
    try {
      // Write locally first
      await enqueueMutation(
        "sessions",
        "update",
        { state: 2 },
        { id: sessionId }
      );

      if (isOnline) {
        // Flush queue immediately — includes the update above
        await processQueue(supabase);
        router.push(`/clubs/${clubSlug}/sessions`);
        router.refresh();
      } else {
        // Stay on the page; useEffect will navigate once synced
        setSessionEnded(true);
        setIsEnding(false);
      }
    } catch {
      setIsEnding(false);
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return <ChevronsUpDown className="inline h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="inline h-3 w-3 ml-1" />
    );
  }

  // ─── Sync status indicator ────────────────────────────────────────────────

  function SyncIndicator() {
    if (isSyncing) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing…
        </span>
      );
    }
    if (!isOnline || pendingCount > 0) {
      return (
        <span className="flex items-center gap-1.5 text-xs text-amber-500">
          <WifiOff className="h-3 w-3" />
          {pendingCount > 0 ? `${pendingCount} unsynced` : "Offline"}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-500">
        <Wifi className="h-3 w-3" />
        Synced
      </span>
    );
  }

  // ─── Session ended offline overlay ────────────────────────────────────────

  if (sessionEnded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
        <Check className="h-12 w-12 text-green-500" />
        <h2 className="text-2xl font-bold">Session Ended</h2>
        <p className="text-muted-foreground max-w-sm">
          The session has been marked as complete locally. It will sync to the
          server automatically once your connection is restored.
        </p>
        <div className="flex items-center gap-2 text-sm text-amber-500">
          <WifiOff className="h-4 w-4" />
          Waiting for connection…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Session</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scheduledDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            {scheduledDate.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            •{" "}
            {courtCount} {courtCount === 1 ? "court" : "courts"}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <SyncIndicator />
          <Badge className="bg-green-500 hover:bg-green-500 text-white px-3 py-1 text-sm">
            LIVE
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add Match
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>Auto Generate</DropdownMenuItem>
              <DropdownMenuItem disabled>Add Manual</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Auto Draft</DropdownMenuItem>
              <DropdownMenuItem disabled>Manual Draft</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                disabled={isEnding}
              >
                End Session
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End Session?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isOnline
                    ? "Are you sure you want to end this session? This will mark it as complete."
                    : "You are currently offline. The session will be marked complete locally and synced when your connection returns."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEndSession}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  End Session
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Session Statistics — collapsed by default */}
      <Accordion type="single" collapsible>
        <AccordionItem value="stats" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <BarChart2 className="h-5 w-5 text-muted-foreground shrink-0" />
              <span className="font-semibold">Session Statistics</span>
              <Badge variant="secondary" className="text-xs font-normal">
                {nPlaying} playing • {nCompleted} completed
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg bg-green-500/15 p-4">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {nInProgress}
                  </p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="rounded-lg bg-green-500/15 p-4">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {nCompleted}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="rounded-lg bg-blue-500/15 p-4">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    N/A
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avg Games/Player
                  </p>
                </div>
                <div className="rounded-lg bg-blue-500/15 p-4">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    N/A
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Avg Match Duration
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 text-sm">
                  Player Statistics
                </h3>
                <div className="rounded-md border overflow-hidden">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                        <tr>
                          <th
                            className="text-left p-2 px-3 font-medium cursor-pointer select-none"
                            onClick={() => handleSort("name")}
                          >
                            Player <SortIcon field="name" />
                          </th>
                          <th
                            className="text-center p-2 px-3 font-medium cursor-pointer select-none"
                            onClick={() => handleSort("games")}
                          >
                            Games <SortIcon field="games" />
                          </th>
                          <th
                            className="text-center p-2 px-3 font-medium cursor-pointer select-none"
                            onClick={() => handleSort("time")}
                          >
                            Time <SortIcon field="time" />
                          </th>
                          <th className="text-center p-2 px-3 font-medium">
                            Location
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPlayers.map((sp) => (
                          <tr key={sp.player_id} className="border-t">
                            <td className="p-2 px-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{
                                    backgroundColor:
                                      genderColours[sp.player?.gender ?? 2],
                                  }}
                                />
                                {sp.player?.name ?? "Unknown"}
                              </div>
                            </td>
                            <td className="p-2 px-3 text-center text-muted-foreground">
                              0
                            </td>
                            <td className="p-2 px-3 text-center text-muted-foreground">
                              N/A
                            </td>
                            <td className="p-2 px-3 text-center" title="On bench">
                              🪑
                            </td>
                          </tr>
                        ))}
                        {sortedPlayers.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-4 text-center text-muted-foreground"
                            >
                              No players in session
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Courts */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {courts.map((courtNum) => (
          <div
            key={courtNum}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8"
          >
            <div className="h-16 w-16 rounded-full bg-teal-700/60 flex items-center justify-center">
              <Activity className="h-7 w-7 text-teal-300" />
            </div>
            <p className="font-semibold text-teal-400">
              {getCourtName(courtNum)}
            </p>
            <Badge className="bg-green-700/80 hover:bg-green-700/80 text-white gap-1.5">
              <Check className="h-3 w-3" />
              Available
            </Badge>
          </div>
        ))}
      </div>

      {/* Bench */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Armchair className="h-5 w-5 text-teal-500" />
            <h2 className="font-semibold">On Bench</h2>
          </div>
          <Badge className="bg-blue-600 hover:bg-blue-600 text-white">
            {benchPlayers.length} waiting
          </Badge>
        </div>
        <div className="space-y-2">
          {benchPlayers.map((sp) => (
            <div
              key={sp.player_id}
              className="flex items-center rounded-md border p-2"
            >
              <span
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: genderColours[sp.player?.gender ?? 2] }}
              />
              <p className="font-medium ml-2">{sp.player?.name ?? "Unknown"}</p>
            </div>
          ))}
          {benchPlayers.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No players on bench
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
