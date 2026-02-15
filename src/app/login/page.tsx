"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Sparkles, Check } from "lucide-react";

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      className="mr-2"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const benefits = [
  "Free 14-day Pro trial",
  "No credit card required",
  "Cancel anytime",
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/clubs");
    router.refresh();
  }

  async function handleSignUp() {
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Check your email to confirm your account.");
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100/30 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">S</span>
            </div>
            <span className="text-2xl font-bold text-white">SmashScheduler</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Schedule Badminton Sessions Effortlessly
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Join hundreds of clubs already using our intelligent matchmaking and offline-first scheduling.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Calendar className="size-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Smart Scheduling</p>
                <p className="text-sm text-primary-foreground/70">Intelligent matchmaking</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Users className="size-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Player Management</p>
                <p className="text-sm text-primary-foreground/70">Track skills & availability</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="size-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="size-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white">Works Offline</p>
                <p className="text-sm text-primary-foreground/70">Syncs when back online</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-primary-foreground/60">
          © 2026 SmashScheduler. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
                <span className="text-xl font-bold text-primary-foreground">S</span>
              </div>
              <span className="text-2xl font-bold">SmashScheduler</span>
            </Link>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50 p-1">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Log in</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Welcome back</CardTitle>
                    <Badge variant="secondary" className="font-normal">Pro trial included</Badge>
                  </div>
                  <CardDescription>
                    Enter your details to access your club
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleLogin();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    <Button type="submit" disabled={loading} className="w-full h-11">
                      {loading ? "Logging in…" : "Log in"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full h-11"
                  >
                    <GoogleIcon />
                    Google
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signup">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Create account</CardTitle>
                    <Badge variant="secondary" className="font-normal">Free trial</Badge>
                  </div>
                  <CardDescription>
                    Start your 14-day Pro trial today
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSignUp();
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
                    </div>
                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                    {message && (
                      <div className="p-3 rounded-lg bg-green-50 text-sm text-green-600 border border-green-200">
                        {message}
                      </div>
                    )}
                    <Button type="submit" disabled={loading} className="w-full h-11">
                      {loading ? "Creating account…" : "Create account"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full h-11"
                  >
                    <GoogleIcon />
                    Google
                  </Button>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground text-center mb-3">What you get:</p>
                    <div className="space-y-2">
                      {benefits.map((benefit) => (
                        <div key={benefit} className="flex items-center gap-2 text-sm">
                          <Check className="size-4 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
