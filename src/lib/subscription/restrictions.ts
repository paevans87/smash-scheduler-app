import type { PlanType } from "./hooks";

export const RESTRICTIONS = {
  CLUB_COUNT: {
    FREE: 1,
    PRO: Infinity,
  },
  PLAYER_COUNT: {
    FREE: 16,
    PRO: Infinity,
  },
  SESSION_SCHEDULING_DAYS: {
    FREE: 7,
    PRO: Infinity,
  },
  SESSION_RETENTION: {
    FREE: 3,
    PRO: Infinity,
  },
  ORGANISERS: {
    FREE: false,
    PRO: true,
  },
  GUEST_PLAYERS: {
    FREE: false,
    PRO: true,
  },
  CUSTOM_MATCHMAKING_PROFILES: {
    FREE: false,
    PRO: true,
  },
  ANALYTICS: {
    FREE: "minimal",
    PRO: "advanced",
  },
  CSV_EXPORT: {
    FREE: false,
    PRO: true,
  },
  BRANDING: {
    FREE: false,
    PRO: true,
  },
} as const;

export function canCreateClub(currentClubCount: number, planType: PlanType): boolean {
  const max = planType === "pro" ? RESTRICTIONS.CLUB_COUNT.PRO : RESTRICTIONS.CLUB_COUNT.FREE;
  return max === Infinity || currentClubCount < max;
}

export function canAddPlayer(currentPlayerCount: number, planType: PlanType): boolean {
  const max = planType === "pro" ? RESTRICTIONS.PLAYER_COUNT.PRO : RESTRICTIONS.PLAYER_COUNT.FREE;
  return max === Infinity || currentPlayerCount < max;
}

export function canScheduleSession(scheduledDate: Date, planType: PlanType): boolean {
  const maxDays = planType === "pro" 
    ? RESTRICTIONS.SESSION_SCHEDULING_DAYS.PRO 
    : RESTRICTIONS.SESSION_SCHEDULING_DAYS.FREE;
  
  if (maxDays === Infinity) return true;

  const now = new Date();
  const daysUntil = Math.ceil((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= maxDays;
}

export function canUseOrganisers(planType: PlanType): boolean {
  return planType === "pro" ? RESTRICTIONS.ORGANISERS.PRO : RESTRICTIONS.ORGANISERS.FREE;
}

export function canUseGuestPlayers(planType: PlanType): boolean {
  return planType === "pro" ? RESTRICTIONS.GUEST_PLAYERS.PRO : RESTRICTIONS.GUEST_PLAYERS.FREE;
}

export function canUseCustomMatchmakingProfiles(planType: PlanType): boolean {
  return planType === "pro" 
    ? RESTRICTIONS.CUSTOM_MATCHMAKING_PROFILES.PRO 
    : RESTRICTIONS.CUSTOM_MATCHMAKING_PROFILES.FREE;
}

export function canExportCsv(planType: PlanType): boolean {
  return planType === "pro" ? RESTRICTIONS.CSV_EXPORT.PRO : RESTRICTIONS.CSV_EXPORT.FREE;
}

export function canUseBranding(planType: PlanType): boolean {
  return planType === "pro" ? RESTRICTIONS.BRANDING.PRO : RESTRICTIONS.BRANDING.FREE;
}

export function getAnalyticsLevel(planType: PlanType): "minimal" | "advanced" {
  return planType === "pro" ? RESTRICTIONS.ANALYTICS.PRO : RESTRICTIONS.ANALYTICS.FREE;
}
