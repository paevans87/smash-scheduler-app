import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SideNav } from "@/components/side-nav";
import { BottomNav } from "@/components/bottom-nav";
import { ClubBreadcrumbs } from "@/components/club-breadcrumbs";

type ClubLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
};

export default async function ClubLayout({
  children,
  params,
}: ClubLayoutProps) {
  const { clubSlug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .single();

  if (!club) {
    redirect("/clubs");
  }

  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/clubs");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("club_id", club.id)
    .limit(1)
    .single();

  if (!subscription) {
    redirect("/clubs");
  }

  if (subscription.status === "cancelled" || subscription.status === "expired") {
    redirect(`/subscription-lapsed?club=${clubSlug}`);
  }

  return (
    <div className="flex min-h-screen">
      <SideNav clubSlug={clubSlug} clubName={club.name} userEmail={user.email!} />
      <div className="flex flex-1 flex-col md:min-h-screen">
        <div className="border-b px-4 py-3 md:px-6">
          <ClubBreadcrumbs clubSlug={clubSlug} clubName={club.name} />
        </div>
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav clubSlug={clubSlug} userEmail={user.email!} />
    </div>
  );
}
