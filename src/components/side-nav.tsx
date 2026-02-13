"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/profile-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

type SideNavProps = {
  clubId: string;
  userEmail: string;
};

const STORAGE_KEY = "sidenav-collapsed";

export function SideNav({ clubId, userEmail }: SideNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

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
      href: `/clubs/${clubId}`,
      isActive: pathname === `/clubs/${clubId}`,
    },
    {
      label: "Sessions",
      icon: Calendar,
      href: "#",
      isActive: false,
    },
    {
      label: "Club Management",
      icon: Settings,
      href: "#",
      isActive: false,
    },
  ];

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
          href={`/clubs/${clubId}`}
          className="flex items-center gap-2 font-semibold"
        >
          <Image
            src="/icon-192.png"
            alt="SmashScheduler"
            width={32}
            height={32}
            className="shrink-0"
          />
          {!collapsed && <span className="truncate">SmashScheduler</span>}
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
          <div className="flex items-center gap-3 px-3 py-2">
            <ProfileMenu userEmail={userEmail} />
            <span className="truncate text-sm text-muted-foreground">
              {userEmail}
            </span>
          </div>
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
    </aside>
  );
}
