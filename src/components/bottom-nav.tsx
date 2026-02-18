"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Settings, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/profile-menu";
import { FeedbackDialog } from "@/components/feedback-dialog";

type BottomNavProps = {
  clubSlug: string;
  userEmail: string;
};

export function BottomNav({ clubSlug, userEmail }: BottomNavProps) {
  const pathname = usePathname();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: `/clubs/${clubSlug}`,
      isActive: pathname === `/clubs/${clubSlug}`,
    },
    {
      label: "Players",
      icon: Users,
      href: `/clubs/${clubSlug}/players`,
      isActive: pathname.startsWith(`/clubs/${clubSlug}/players`),
    },
    {
      label: "Sessions",
      icon: Calendar,
      href: `/clubs/${clubSlug}/sessions`,
      isActive: pathname.startsWith(`/clubs/${clubSlug}/sessions`),
    },
    {
      label: "Club",
      icon: Settings,
      href: `/clubs/${clubSlug}/manage`,
      isActive: pathname.startsWith(`/clubs/${clubSlug}/manage`),
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex h-16 items-center border-t bg-background md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
            item.isActive
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <item.icon className="size-5" />
          <span>{item.label}</span>
        </Link>
      ))}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors"
      >
        <MessageSquare className="size-5" />
        <span>Feedback</span>
      </button>
      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
        <ProfileMenu userEmail={userEmail} />
        <span>Profile</span>
      </div>
      <FeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </nav>
  );
}
