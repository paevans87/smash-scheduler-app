import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SideNav } from "@/components/side-nav";
import { BottomNav } from "@/components/bottom-nav";
import { Fab } from "@/components/fab";

type ClubLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ clubId: string }>;
};

export default async function ClubLayout({
  children,
  params,
}: ClubLayoutProps) {
  const { clubId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/clubs");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("club_id", clubId)
    .in("status", ["active", "trialling"])
    .limit(1)
    .single();

  if (!subscription) {
    redirect("/clubs");
  }

  return (
    <div className="flex min-h-screen">
      <SideNav clubId={clubId} userEmail={user.email!} />
      <div className="flex flex-1 flex-col md:min-h-screen">
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav clubId={clubId} userEmail={user.email!} />
      <Fab label="Add new club" href="/pricing">
        <Plus className="size-6" />
      </Fab>
    </div>
  );
}
