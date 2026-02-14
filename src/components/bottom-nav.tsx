"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "@/components/profile-menu";

type BottomNavProps = {
  clubSlug: string;
  userEmail: string;
};

export function BottomNav({ clubSlug, userEmail }: BottomNavProps) {
  const pathname = usePathname();

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
      href: "#",
      isActive: false,
    },
    {
      label: "Club",
      icon: Settings,
      href: "#",
      isActive: false,
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
      <div className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground">
        <ProfileMenu userEmail={userEmail} />
        <span>Profile</span>
      </div>
    </nav>
  );
}
