"use client";

import { Suspense } from "react";
import Image from "next/image";
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
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialCode = searchParams.get("code") ?? "";

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-green-50 via-white to-green-100/30 px-4 py-12 dark:from-background dark:via-background dark:to-background">
      {/* Decorative background blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-8">
        {/* Branding */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/icon-192.png"
            alt="SmashScheduler"
            width={56}
            height={56}
            className="shrink-0 drop-shadow-md"
          />
          <h1 className="text-2xl font-bold tracking-tight">SmashScheduler</h1>
        </div>

        {/* Heading */}
        <div className="text-center">
          <h2 className="text-xl font-semibold">Get Started</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Join an existing club or create your own.
          </p>
        </div>

        {/* Option cards */}
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <Card className="flex-1 bg-white/80 backdrop-blur-sm transition-all hover:shadow-md dark:bg-card/80">
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

          <Card className="flex-1 bg-white/80 backdrop-blur-sm transition-all hover:shadow-md dark:bg-card/80">
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

        {/* Sign out & theme */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action="/logout" method="post">
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </form>
        </div>
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
