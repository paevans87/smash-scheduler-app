"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, XCircle, CreditCard, ExternalLink, ArrowDown, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

type LapsedContentProps = {
  clubId: string;
  clubSlug: string;
  clubName: string;
  status: "cancelled" | "expired";
  playerCount: number;
  hasStripeCustomer: boolean;
};

const FREE_PLAYER_LIMIT = 16;

export default function LapsedContent({
  clubId,
  clubSlug,
  clubName,
  status,
  playerCount,
  hasStripeCustomer,
}: LapsedContentProps) {
  const router = useRouter();
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");

  const isCancelled = status === "cancelled";
  const hasExcessPlayers = playerCount > FREE_PLAYER_LIMIT;

  async function handleDowngrade() {
    setError("");
    setDowngradeLoading(true);

    try {
      const response = await fetch("/api/billing/downgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to downgrade");
        setDowngradeLoading(false);
        return;
      }

      router.push(`/clubs/${clubSlug}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setDowngradeLoading(false);
    }
  }

  const anyLoading = downgradeLoading || portalLoading || deleteLoading;

  async function handleDeleteClub() {
    setError("");
    setDeleteLoading(true);

    try {
      const response = await fetch("/api/billing/delete-club", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to delete club");
        setDeleteLoading(false);
        return;
      }

      router.push("/clubs");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleteLoading(false);
    }
  }

  async function handleFixSubscription() {
    setError("");
    setPortalLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to open billing portal");
        setPortalLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setPortalLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {isCancelled ? (
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <XCircle className="size-6 text-red-500" />
            </div>
          ) : (
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <AlertTriangle className="size-6 text-amber-500" />
            </div>
          )}
          <CardTitle>
            {isCancelled
              ? "Subscription Cancelled"
              : "Payment Failed"}
          </CardTitle>
          <CardDescription>
            {isCancelled
              ? `The Pro subscription for ${clubName} has been cancelled.`
              : `The last payment for ${clubName} was unsuccessful.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-center text-sm text-muted-foreground">
            {isCancelled
              ? "Your club is currently inaccessible. Choose how you'd like to proceed:"
              : "Your club is currently inaccessible. Please update your payment method or downgrade to continue:"}
          </p>

          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}

          {/* Option 1: Fix subscription */}
          {hasStripeCustomer && (
            <Card className="border-2">
              <CardContent className="flex flex-col gap-3 pt-6">
                <h3 className="font-semibold">
                  {isCancelled ? "Resubscribe to Pro" : "Fix payment method"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isCancelled
                    ? "Resubscribe to restore all Pro features including unlimited players, advanced scheduling, and custom matchmaking profiles."
                    : "Update your payment method to restore your Pro subscription and all its features."}
                </p>
                <Button
                  onClick={handleFixSubscription}
                  disabled={anyLoading}
                >
                  <CreditCard className="mr-2 size-4" />
                  {portalLoading
                    ? "Opening\u2026"
                    : isCancelled
                      ? "Resubscribe"
                      : "Update payment method"}
                  {!portalLoading && <ExternalLink className="ml-2 size-3" />}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Option 2: Downgrade to free */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <h3 className="font-semibold">Downgrade to Free</h3>
              <p className="text-sm text-muted-foreground">
                Continue using your club on the Free plan with limited features:
              </p>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                <li>
                  {"\u2022"} Maximum of {FREE_PLAYER_LIMIT} players
                  {hasExcessPlayers && (
                    <span className="ml-1 text-amber-600 dark:text-amber-400">
                      (you currently have {playerCount} — you won't be able to add new players until under the limit)
                    </span>
                  )}
                </li>                
                <li>{"\u2022"} Custom matchmaking profiles will be removed</li>
                <li>{"\u2022"} No guest players or multiple organisers</li>
              </ul>
              <Button
                variant="outline"
                onClick={handleDowngrade}
                disabled={anyLoading}
              >
                <ArrowDown className="mr-2 size-4" />
                {downgradeLoading ? "Downgrading\u2026" : "Downgrade to Free"}
              </Button>
            </CardContent>
          </Card>

          {/* Option 3: Delete club */}
          <Card>
            <CardContent className="flex flex-col gap-3 pt-6">
              <h3 className="font-semibold">Delete Club</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete <b>{clubName}</b> and all its data including players,
                sessions, and match history. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={anyLoading}
                  >
                    <Trash2 className="mr-2 size-4" />
                    {deleteLoading ? "Deleting\u2026" : "Delete Club"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {clubName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the club and all associated data
                      including players, sessions, and match history. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteClub}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
