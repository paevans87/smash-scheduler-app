"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type ClubBreadcrumbsProps = {
  clubSlug: string;
  clubName: string;
};

const segmentLabels: Record<string, string> = {
  sessions: "Sessions",
  settings: "Settings",
  players: "Players",
};

export function ClubBreadcrumbs({ clubSlug, clubName }: ClubBreadcrumbsProps) {
  const pathname = usePathname();
  const clubBase = `/clubs/${clubSlug}`;
  const remainder = pathname.slice(clubBase.length).replace(/^\//, "");
  const segments = remainder ? remainder.split("/") : [];

  const currentLabel =
    segments.length > 0
      ? segmentLabels[segments[0]] ?? segments[0]
      : "Dashboard";

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:flex">
            <BreadcrumbPage>{clubName}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbItem className="flex md:hidden">
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:flex">
          <BreadcrumbLink href={clubBase}>{clubName}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:flex" />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
