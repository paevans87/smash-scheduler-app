"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StripePriceInfo } from "@/lib/stripe-prices";

function formatPrice(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(unitAmount / 100);
}

type PricingContentProps = {
  proPrices: StripePriceInfo[];
  stripeFetchError: boolean;
  canCreateFreeClub: boolean;
};

export default function PricingContent({
  proPrices,
  stripeFetchError,
  canCreateFreeClub,
}: PricingContentProps) {
  const router = useRouter();
  const [clubName, setClubName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">(
    "month"
  );

  const monthlyPrice = proPrices.find((p) => p.interval === "month");
  const yearlyPrice = proPrices.find((p) => p.interval === "year");
  const selectedPrice =
    selectedInterval === "year" ? yearlyPrice : monthlyPrice;
  const proPricingAvailable =
    !stripeFetchError && proPrices.length > 0 && selectedPrice;

  async function handleSelectFree() {
    setError("");

    if (!clubName.trim()) {
      setError("Please enter a club name.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc(
      "create_club_with_subscription",
      {
        p_club_name: clubName.trim(),
        p_plan_type: "free",
        p_status: "active",
      }
    );

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.push("/clubs");
    router.refresh();
  }

  async function handleStartTrial() {
    setError("");

    if (!clubName.trim()) {
      setError("Please enter a club name.");
      return;
    }

    if (!monthlyPrice) return;

    setLoading(true);

    try {
      const response = await fetch("/api/checkout/trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubName: clubName.trim(),
          priceId: monthlyPrice.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to start trial");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleSelectPro() {
    setError("");

    if (!clubName.trim()) {
      setError("Please enter a club name.");
      return;
    }

    if (!selectedPrice) return;

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPrice.id,
          clubName: clubName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to start checkout");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">Choose a Plan</h1>
        <p className="mb-4 text-center text-muted-foreground">
          Name your club and pick a plan to get started.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="club-name">Club Name</Label>
          <Input
            id="club-name"
            placeholder="e.g. Shuttle Stars"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="flex w-full max-w-4xl flex-col gap-6 md:flex-row">
        <Card className={`flex flex-1 flex-col ${!canCreateFreeClub ? 'opacity-75' : ''}`}>
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Basic scheduling for small clubs</CardDescription>
            <p className="text-lg font-semibold">Free</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              <li>{"\u2022"} 1 club only</li>
              <li>{"\u2022"} 16 players max</li>
              <li>{"\u2022"} 7 days advance scheduling</li>
            </ul>
            {!canCreateFreeClub && (
              <p className="text-xs text-muted-foreground text-center">
                You have reached the free club limit. Upgrade to Pro for unlimited clubs.
              </p>
            )}
            <Button
              className="w-full"
              disabled={loading || !canCreateFreeClub}
              onClick={handleSelectFree}
            >
              {loading ? "Creating\u2026" : canCreateFreeClub ? "Select Free" : "Limit Reached"}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>
              Full features for growing clubs
            </CardDescription>
            {proPricingAvailable ? (
              <div className="flex flex-col gap-2">
                {monthlyPrice && yearlyPrice && (
                  <Tabs
                    value={selectedInterval}
                    onValueChange={(v) =>
                      setSelectedInterval(v as "month" | "year")
                    }
                  >
                    <TabsList className="w-full">
                      <TabsTrigger value="month">Monthly</TabsTrigger>
                      <TabsTrigger value="year">Yearly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
                <p className="text-lg font-semibold">
                  {formatPrice(selectedPrice.unitAmount, selectedPrice.currency)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{selectedPrice.interval === "year" ? "yr" : "mo"}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-lg font-semibold text-muted-foreground">
                Pricing unavailable
              </p>
            )}
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              <li>{"\u2022"} Unlimited courts</li>
              <li>{"\u2022"} Analytics</li>
              <li>{"\u2022"} Advanced matchmaking</li>
            </ul>
            <Button
              className="w-full"
              disabled={!proPricingAvailable || loading}
              onClick={handleSelectPro}
            >
              {loading ? "Creating\u2026" : "Select Pro"}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-1 flex-col">
          <CardHeader>
            <CardTitle>Pro Trial</CardTitle>
            <CardDescription>
              Try all Pro features at no cost
            </CardDescription>
            <p className="text-lg font-semibold">Free for 14 days</p>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              <li>{"\u2022"} Unlimited courts</li>
              <li>{"\u2022"} Analytics</li>
              <li>{"\u2022"} Advanced matchmaking</li>
              <li>{"\u2022"} 14-day trial</li>
            </ul>
            <Button
              className="w-full"
              disabled={!proPricingAvailable || loading}
              onClick={handleStartTrial}
            >
              {loading ? "Creating\u2026" : "Start Free Trial"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
