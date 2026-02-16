"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL = 2000;
const TIMEOUT = 30000;

type Subscription = { status: string; plan_type?: string };

function toArray(subs: Subscription | Subscription[] | null | undefined): Subscription[] {
  if (!subs) return [];
  return Array.isArray(subs) ? subs : [subs];
}

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const upgradeClubSlug = searchParams.get("upgrade");
  const isUpgrade = !!upgradeClubSlug;
  const [state, setState] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const fulfilledRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const successUrl = isUpgrade ? `/clubs/${upgradeClubSlug}` : "/clubs";
  const fulfilUrl = isUpgrade ? "/api/checkout/upgrade/fulfil" : "/api/checkout/fulfil";
  const backUrl = isUpgrade ? `/upgrade?club=${upgradeClubSlug}` : "/pricing";

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setState("error");
      setErrorMessage("No checkout session found.");
      return;
    }

    const supabase = createClient();

    const pollForCompletion = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        cleanup();
        router.push("/login");
        return;
      }

      if (isUpgrade) {
        const { data: club } = await supabase
          .from("clubs")
          .select("id, subscriptions(status, plan_type)")
          .eq("slug", upgradeClubSlug)
          .single();

        if (!club) return;

        const rawSubs = (
          club as unknown as { id: string; subscriptions: Subscription | Subscription[] | null }
        ).subscriptions;

        const isNowPro = toArray(rawSubs).some(
          (s) => (s.status === "active" || s.status === "trialling") && s.plan_type === "pro"
        );

        if (isNowPro) {
          cleanup();
          router.push(successUrl);
        }
      } else {
        const { data } = await supabase
          .from("club_organisers")
          .select("club_id, clubs:club_id(id, subscriptions(status))")
          .eq("user_id", user.id)
          .limit(1);

        const club = data?.[0];
        if (!club) return;

        const rawSubs = (
          club.clubs as unknown as {
            id: string;
            subscriptions: Subscription | Subscription[] | null;
          }
        )?.subscriptions;

        const hasActiveSubscription = toArray(rawSubs).some(
          (s) => s.status === "active" || s.status === "trialling"
        );

        if (hasActiveSubscription) {
          cleanup();
          router.push(successUrl);
        }
      }
    };

    const triggerFulfilment = async () => {
      if (fulfilledRef.current) return;
      fulfilledRef.current = true;

      try {
        const response = await fetch(fulfilUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (response.ok) {
          cleanup();
          router.push(successUrl);
          return;
        }
      } catch {
        // Fulfilment failed — polling will catch webhook-based completion
      }
    };

    triggerFulfilment();

    pollingRef.current = setInterval(pollForCompletion, POLL_INTERVAL);

    timeoutRef.current = setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setState("error");
      setErrorMessage(
        isUpgrade
          ? "Upgrading your club is taking longer than expected. Please try again or contact support."
          : "Setting up your club is taking longer than expected. Please try again or contact support."
      );
    }, TIMEOUT);

    return cleanup;
  }, [sessionId, router, cleanup, isUpgrade, upgradeClubSlug, successUrl, fulfilUrl]);

  const handleRetry = () => {
    setState("loading");
    setErrorMessage("");
    fulfilledRef.current = false;
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {state === "loading"
              ? isUpgrade
                ? "Upgrading your club..."
                : "Setting up your club..."
              : "Something went wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {state === "loading" ? (
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              {errorMessage}
            </p>
          )}
        </CardContent>
        {state === "error" && (
          <CardFooter className="flex flex-col gap-2">
            <Button onClick={handleRetry} className="w-full">
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(backUrl)}
              className="w-full"
            >
              {isUpgrade ? "Back to upgrade" : "Back to pricing"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

export default function CheckoutPendingPage() {
  return (
    <Suspense>
      <PendingContent />
    </Suspense>
  );
}
