"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCode = searchParams.get("code") ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-2xl flex-col gap-6 md:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Accept an Invite</CardTitle>
            <CardDescription>
              Enter the code from your organiser
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="Enter invite code"
                defaultValue={initialCode}
              />
            </div>
            <Button disabled className="w-full">
              Join Club
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Create a Club</CardTitle>
            <CardDescription>
              Start your own club and manage sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => router.push("/pricing")}
            >
              Create a Club
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
