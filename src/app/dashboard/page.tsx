import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p className="text-muted-foreground">{user.email}</p>
      <p className="text-muted-foreground">Dashboard coming soon</p>
      <SignOutButton />
    </div>
  );
}
