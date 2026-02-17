"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

type DeleteClubSectionProps = {
  clubId: string;
  clubName: string;
  hasActiveSubscription: boolean;
};

export function DeleteClubSection({
  clubId,
  clubName,
  hasActiveSubscription,
}: DeleteClubSectionProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  async function handleDelete() {
    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/billing/delete-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Failed to delete club");
        setIsDeleting(false);
        return;
      }

      router.push("/clubs");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsDeleting(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPortalLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  }

  return (
    <Card className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400">
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible actions that permanently affect your club
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <div className="space-y-1">
            <p className="font-medium text-red-800 dark:text-red-200">
              Delete this club
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              Permanently delete this club and all of its data, including
              players, sessions, and match history. This action cannot be undone.
            </p>
            {hasActiveSubscription && (
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                You must cancel your subscription before deleting this club.
              </p>
            )}
          </div>

          {hasActiveSubscription ? (
            <Button
              variant="outline"
              className="shrink-0"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              <CreditCard className="mr-2 size-4" />
              {portalLoading ? "Opening…" : "Cancel subscription first"}
              {!portalLoading && <ExternalLink className="ml-2 size-3" />}
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="shrink-0">
                  <Trash2 className="mr-2 size-4" />
                  Delete Club
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <span className="block">
                      This will permanently delete{" "}
                      <strong>{clubName}</strong> and all associated data
                      including:
                    </span>
                    <span className="block">
                      &bull; All players and their skill ratings{"\n"}
                      &bull; All sessions and match history{"\n"}
                      &bull; All custom matchmaking profiles
                    </span>
                    <span className="block font-medium text-red-600 dark:text-red-400">
                      This action is irreversible.
                    </span>
                  </AlertDialogDescription>
                </AlertDialogHeader>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-700"
                  >
                    {isDeleting
                      ? "Deleting..."
                      : "Delete this club permanently"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
