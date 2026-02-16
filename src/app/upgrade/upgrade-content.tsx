"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StripePriceInfo } from "@/lib/stripe-prices";

function formatPrice(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(unitAmount / 100);
}

type UpgradeContentProps = {
  clubId: string;
  clubSlug: string;
  clubName: string;
  monthlyPrice: StripePriceInfo | null;
  stripeFetchError: boolean;
};

const PRO_FEATURES = [
  "Unlimited players",
  "Advanced scheduling",
  "Custom matchmaking profiles",
  "Multiple organisers",
  "Guest players",
  "Advanced analytics"
];

export default function UpgradeContent({
  clubId,
  clubSlug,
  clubName,
  monthlyPrice,
  stripeFetchError,
}: UpgradeContentProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pricingAvailable = !stripeFetchError && monthlyPrice !== null;

  async function handleUpgrade() {
    if (!monthlyPrice) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/checkout/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: monthlyPrice.id,
          clubId,
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
      <div className="w-full max-w-sm text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <Crown className="size-6 text-amber-500" />
          <h1 className="text-2xl font-bold">Upgrade to Pro</h1>
        </div>
        <p className="text-muted-foreground">
          Unlock all features for <span className="font-medium">{clubName}</span>
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Pro</CardTitle>
          <CardDescription>Full features for growing clubs</CardDescription>
          {pricingAvailable ? (
            <p className="text-lg font-semibold">
              {formatPrice(monthlyPrice.unitAmount, monthlyPrice.currency)}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
          ) : (
            <p className="text-lg font-semibold text-muted-foreground">
              Pricing unavailable
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            disabled={!pricingAvailable || loading}
            onClick={handleUpgrade}
          >
            {loading ? "Redirecting\u2026" : "Subscribe"}
          </Button>

          <Button variant="ghost" className="w-full" asChild>
            <Link href={`/clubs/${clubSlug}`}>Cancel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
