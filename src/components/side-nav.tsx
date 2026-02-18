"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/profile-menu";
import { FeedbackDialog } from "@/components/feedback-dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type SideNavProps = {
  clubSlug: string;
  clubName: string;
  userEmail: string;
  showSwitchClub: boolean;
};

const STORAGE_KEY = "sidenav-collapsed";

export function SideNav({
  clubSlug,
  clubName,
  userEmail,
  showSwitchClub,
}: SideNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    setMounted(true);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

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
      label: "Club Management",
      icon: Settings,
      href: `/clubs/${clubSlug}/manage`,
      isActive: pathname.startsWith(`/clubs/${clubSlug}/manage`),
    },
  ];

  const switchClubContent = (
    <Link
      href="/clubs"
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
    >
      <ArrowLeftRight className="size-5 shrink-0" />
      {!collapsed && <span>Switch Club</span>}
    </Link>
  );

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r bg-background transition-all duration-200",
        collapsed ? "w-16" : "w-60",
        !mounted && "w-60"
      )}
    >
      <div className={cn("flex h-14 items-center border-b px-4", collapsed && "justify-center px-0")}>
        <Link
          href={`/clubs/${clubSlug}`}
          className="flex items-center gap-2 font-semibold"
        >
          <Image
            src="/icon-192.png"
            alt="SmashScheduler"
            width={32}
            height={32}
            className="shrink-0"
          />
          {!collapsed && <span className="truncate">{clubName}</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const linkContent = (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}

        <div className="mt-2 border-t pt-2">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <MessageSquare className="size-5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Feedback</TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => setFeedbackOpen(true)}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <MessageSquare className="size-5 shrink-0" />
              <span>Feedback</span>
            </button>
          )}
        </div>

        {showSwitchClub && (
          <>
            <div className="my-2 border-t" />

            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{switchClubContent}</TooltipTrigger>
                <TooltipContent side="right">Switch Club</TooltipContent>
              </Tooltip>
            ) : (
              switchClubContent
            )}
          </>
        )}
      </nav>

      <div className={cn("border-t p-2", collapsed && "flex justify-center")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ProfileMenu userEmail={userEmail} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">Profile</TooltipContent>
          </Tooltip>
        ) : (
          <ProfileMenu userEmail={userEmail} showEmail />
        )}
      </div>

      <div className="border-t p-2">
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center justify-center rounded-md py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </button>
      </div>
      <FeedbackDialog
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </aside>
  );
}
