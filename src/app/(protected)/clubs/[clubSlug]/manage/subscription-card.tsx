"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, CreditCard, ExternalLink, AlertTriangle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PlanType } from "@/lib/subscription/hooks";

type SubscriptionStatus = "active" | "trialling" | "cancelled" | "expired";

type SubscriptionCardProps = {
  clubId: string;
  clubSlug: string;
  planType: PlanType;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  monthlyAmount: string | null;
  hasStripeSubscription: boolean;
};

export function SubscriptionCard({
  clubId,
  clubSlug,
  planType,
  status,
  currentPeriodEnd,
  monthlyAmount,
  hasStripeSubscription,
}: SubscriptionCardProps) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  const isPro = planType === "pro";
  const isTrial = status === "trialling";
  const isCancelled = status === "cancelled";
  const isExpired = status === "expired";
  const isInactive = isCancelled || isExpired;

  const formattedDate = currentPeriodEnd
    ? new Date(currentPeriodEnd).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  async function handleManageBilling() {
    setPortalError("");
    setPortalLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPortalError(data.error ?? "Failed to open billing portal");
        setPortalLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setPortalError("Something went wrong. Please try again.");
      setPortalLoading(false);
    }
  }

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            You are on the Free plan
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
            <Crown className="size-4 shrink-0 text-amber-500" />
            <p className="text-amber-800 dark:text-amber-200">
              Upgrade to Pro for unlimited players, advanced scheduling, custom
              matchmaking profiles, and more.
            </p>
          </div>
          <Button asChild>
            <Link href={`/upgrade?club=${clubSlug}`}>
              <Crown className="mr-2 size-4" />
              Upgrade to Pro
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          {isInactive
            ? "Your Pro subscription is no longer active"
            : isTrial
              ? "Pro Trial plan"
              : "Pro plan"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isCancelled && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950">
            <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Subscription cancelled
              </p>
              <p className="text-red-700 dark:text-red-300">
                Your Pro subscription has been cancelled. Pro features are no longer available.
              </p>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm dark:border-red-900 dark:bg-red-950">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Payment failed
              </p>
              <p className="text-red-700 dark:text-red-300">
                Your last payment was unsuccessful. Please update your payment method to restore Pro features.
              </p>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Plan</dt>
          <dd className="font-medium">{isTrial ? "Pro (Trial)" : "Pro"}</dd>

          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">
            {status === "active" && (
              <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">Active</span>
            )}
            {status === "trialling" && (
              <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400">Trial</span>
            )}
            {status === "cancelled" && (
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">Cancelled</span>
            )}
            {status === "expired" && (
              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">Payment failed</span>
            )}
          </dd>

          {monthlyAmount && !isInactive && (
            <>
              <dt className="text-muted-foreground">Amount</dt>
              <dd className="font-medium">{monthlyAmount}/mo</dd>
            </>
          )}

          {formattedDate && (
            <>
              <dt className="text-muted-foreground">
                {isInactive
                  ? "Ended"
                  : isTrial
                    ? "Trial ends"
                    : "Next billing date"}
              </dt>
              <dd className="font-medium">{formattedDate}</dd>
            </>
          )}
        </dl>

        {portalError && (
          <p className="text-sm text-destructive">{portalError}</p>
        )}

        <div className="flex flex-col gap-2">
          {hasStripeSubscription && isExpired && (
            <Button
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              <CreditCard className="mr-2 size-4" />
              {portalLoading ? "Opening\u2026" : "Update payment method"}
              {!portalLoading && <ExternalLink className="ml-2 size-3" />}
            </Button>
          )}

          {hasStripeSubscription && !isInactive && (
            <Button
              variant="outline"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              <CreditCard className="mr-2 size-4" />
              {portalLoading ? "Opening\u2026" : "Manage billing"}
              {!portalLoading && <ExternalLink className="ml-2 size-3" />}
            </Button>
          )}

          {isCancelled && (
            <Button asChild>
              <Link href={`/upgrade?club=${clubSlug}`}>
                <Crown className="mr-2 size-4" />
                Resubscribe to Pro
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
