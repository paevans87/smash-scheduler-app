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

const plans = [
  {
    name: "Free",
    price: "Free",
    description: "Basic scheduling for small clubs",
    features: ["Basic scheduling", "1 court"],
    planType: "free",
    status: "active",
    disabled: false,
    buttonLabel: "Select Free",
  },
  {
    name: "Pro",
    price: "Paid",
    description: "Full features for growing clubs",
    features: ["Unlimited courts", "Analytics", "AI matchmaking"],
    planType: "pro",
    status: "active",
    disabled: true,
    buttonLabel: "Coming Soon",
  },
  {
    name: "Pro Trial",
    price: "Free for 14 days",
    description: "Try all Pro features at no cost",
    features: [
      "Unlimited courts",
      "Analytics",
      "AI matchmaking",
      "14-day trial",
    ],
    planType: "pro",
    status: "trialling",
    disabled: false,
    buttonLabel: "Start Free Trial",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [clubName, setClubName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSelectPlan(planType: string, status: string) {
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
        p_plan_type: planType,
        p_status: status,
      }
    );

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
        {plans.map((plan) => (
          <Card key={plan.name} className="flex flex-1 flex-col">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <p className="text-lg font-semibold">{plan.price}</p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>{"\u2022"} {feature}</li>
                ))}
              </ul>
              <Button
                className="w-full"
                disabled={plan.disabled || loading}
                onClick={() => handleSelectPlan(plan.planType, plan.status)}
              >
                {loading && !plan.disabled ? "Creating\u2026" : plan.buttonLabel}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
