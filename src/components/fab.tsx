"use client";

import Link from "next/link";

type FabProps = {
  children: React.ReactNode;
  label: string;
  href: string;
};

export function Fab({ children, label, href }: FabProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-fab)] transition-shadow hover:shadow-[var(--shadow-hover)] bottom-22 right-4 md:bottom-6 md:right-6"
    >
      {children}
    </Link>
  );
}
