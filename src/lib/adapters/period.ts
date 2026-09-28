import type { AnalyticsPeriod } from "@/lib/adapters/types";

export function periodDays(period: AnalyticsPeriod) {
  return period === "7d" ? 7 : 30;
}

export function sinceIso(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

/** Inclusive lower bound for analytics (current + previous period). */
export function analyticsSinceIso(period: AnalyticsPeriod) {
  return sinceIso(periodDays(period) * 2);
}

export function overviewSinceIso() {
  return sinceIso(30);
}
