"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/offline/online-status-provider";
import { enqueuePendingChange } from "@/lib/offline/pending-changes";
import { getDb } from "@/lib/offline/db";

type DeletePlayerDialogProps = {
  playerId: string;
  playerName: string;
  onDeleted?: () => void;
};

export function DeletePlayerDialog({ playerId, playerName, onDeleted }: DeletePlayerDialogProps) {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);

    if (isOnline) {
      const supabase = createClient();
      await supabase.from("players").delete().eq("id", playerId);
      onDeleted?.();
      router.refresh();
    } else {
      const db = await getDb();
      await db.delete("players", playerId);
      await enqueuePendingChange({
        table: "players",
        operation: "delete",
        payload: { id: playerId },
      });
      onDeleted?.();
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete player</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {playerName}? This will also remove them from all sessions and blacklists. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
