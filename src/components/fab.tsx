"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, UserPlus, CalendarPlus } from "lucide-react";
import { cn } from "@/lib/utils";

type FabProps = {
  clubSlug: string;
};

const actions = [
  {
    label: "Add Session",
    icon: CalendarPlus,
    getHref: (slug: string) => `/clubs/${slug}/sessions/new`,
  },
  {
    label: "Add Player",
    icon: UserPlus,
    getHref: (slug: string) => `/clubs/${slug}/players/new`,
  },
];

export function Fab({ clubSlug }: FabProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="fixed z-50 bottom-22 right-4 md:bottom-6 md:right-6 flex flex-col items-end gap-3">
      {actions.map((action, i) => (
        <Link
          key={action.label}
          href={action.getHref(clubSlug)}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-2 rounded-full bg-card px-4 py-2.5 text-sm font-medium text-card-foreground shadow-[var(--shadow-md)] transition-all",
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          )}
          style={{ transitionDelay: open ? `${(actions.length - 1 - i) * 50}ms` : "0ms" }}
        >
          <action.icon className="size-4" />
          {action.label}
        </Link>
      ))}
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Close menu" : "Open menu"}
        className={cn(
          "flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fab)] transition-all duration-200",
          open && "rotate-45"
        )}
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}
