import type { AnalyticsPeriod } from "@/lib/adapters/types";
import {
  MARKETING_LOCALE_LABELS,
  marketingPageLabel,
  marketingServiceLabel,
} from "@/lib/marketing/constants";
import type {
  MarketingAnalyticsRawData,
  MarketingAnalyticsSnapshot,
  MarketingBreakdownRow,
  MarketingDailyPoint,
  MarketingPageRow,
  MarketingServiceRow,
} from "@/lib/marketing/types";

function periodMs(period: AnalyticsPeriod) {
  const days = period === "7d" ? 7 : 30;
  return days * 86_400_000;
}

function splitPeriod<T extends { createdAt: string }>(
  items: T[],
  period: AnalyticsPeriod,
) {
  const windowMs = periodMs(period);
  const end = Date.now();
  const currentStart = end - windowMs;
  const previousStart = currentStart - windowMs;

  const current: T[] = [];
  const previous: T[] = [];

  for (const item of items) {
    const time = new Date(item.createdAt).getTime();
    if (Number.isNaN(time)) continue;
    if (time >= currentStart) current.push(item);
    else if (time >= previousStart && time < currentStart) previous.push(item);
  }

  return { current, previous };
}

function changePct(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function buildBreakdown(
  entries: Array<{ key: string; label: string }>,
): MarketingBreakdownRow[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const entry of entries) {
    const key = entry.key || "unknown";
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { label: entry.label || key, count: 1 });
  }
  const total = entries.length || 1;
  return Array.from(counts.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      count: value.count,
      sharePct: Number(((value.count / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
}

function buildTopPages(
  pageViews: Array<{ page: string; path: string; sessionId: string }>,
): MarketingPageRow[] {
  const byPage = new Map<
    string,
    { page: string; path: string; views: number; sessions: Set<string> }
  >();

  for (const row of pageViews) {
    const key = row.page || row.path || "unknown";
    const existing = byPage.get(key);
    if (existing) {
      existing.views += 1;
      if (row.sessionId) existing.sessions.add(row.sessionId);
      if (!existing.path && row.path) existing.path = row.path;
    } else {
      byPage.set(key, {
        page: row.page || key,
        path: row.path,
        views: 1,
        sessions: new Set(row.sessionId ? [row.sessionId] : []),
      });
    }
  }

  const totalViews = pageViews.length || 1;
  return Array.from(byPage.values())
    .map((row) => ({
      page: row.page,
      path: row.path,
      label: marketingPageLabel(row.page, row.path),
      views: row.views,
      sessions: row.sessions.size,
      sharePct: Number(((row.views / totalViews) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.views - a.views);
}

function buildServices(
  pageViews: Array<{ service: string; page: string }>,
  leads: Array<{ service: string; page: string }>,
): MarketingServiceRow[] {
  const views = new Map<string, number>();
  const leadCounts = new Map<string, number>();

  for (const row of pageViews) {
    const id = row.service || row.page || "unknown";
    views.set(id, (views.get(id) ?? 0) + 1);
  }
  for (const row of leads) {
    const id = row.service || row.page || "unknown";
    leadCounts.set(id, (leadCounts.get(id) ?? 0) + 1);
  }

  const ids = new Set([...views.keys(), ...leadCounts.keys()]);
  return Array.from(ids)
    .map((id) => ({
      id,
      label: marketingServiceLabel(id),
      views: views.get(id) ?? 0,
      leads: leadCounts.get(id) ?? 0,
    }))
    .sort((a, b) => b.views - a.views || b.leads - a.leads);
}

function buildDailySeries(
  period: AnalyticsPeriod,
  pageViews: Array<{ createdAt: string }>,
  leads: Array<{ createdAt: string }>,
): MarketingDailyPoint[] {
  const days = period === "7d" ? 7 : 30;
  const points: MarketingDailyPoint[] = [];
  const viewByDay = new Map<string, number>();
  const leadByDay = new Map<string, number>();

  for (const row of pageViews) {
    const day = row.createdAt.slice(0, 10);
    if (!day) continue;
    viewByDay.set(day, (viewByDay.get(day) ?? 0) + 1);
  }
  for (const row of leads) {
    const day = row.createdAt.slice(0, 10);
    if (!day) continue;
    leadByDay.set(day, (leadByDay.get(day) ?? 0) + 1);
  }

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    points.push({
      date: iso,
      label: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
      }).format(date),
      views: viewByDay.get(iso) ?? 0,
      leads: leadByDay.get(iso) ?? 0,
    });
  }

  return points;
}

export function buildMarketingAnalyticsSnapshot(
  period: AnalyticsPeriod,
  raw: MarketingAnalyticsRawData,
): MarketingAnalyticsSnapshot {
  const { current: currentEvents, previous: previousEvents } = splitPeriod(
    raw.events,
    period,
  );
  const { current: currentLeads, previous: previousLeads } = splitPeriod(
    raw.leads,
    period,
  );

  const currentPageViews = currentEvents.filter((e) => e.event === "page_view");
  const previousPageViews = previousEvents.filter((e) => e.event === "page_view");

  const currentSessions = new Set(
    currentPageViews.map((e) => e.sessionId).filter(Boolean),
  ).size;
  const previousSessions = new Set(
    previousPageViews.map((e) => e.sessionId).filter(Boolean),
  ).size;

  const pageViews = currentPageViews.length;
  const prevPageViews = previousPageViews.length;
  const leads = currentLeads.length;
  const prevLeads = previousLeads.length;
  const conversionRate =
    currentSessions > 0
      ? Number(((leads / currentSessions) * 100).toFixed(2))
      : 0;

  const locales = buildBreakdown(
    currentPageViews.map((e) => ({
      key: e.locale || "unknown",
      label: MARKETING_LOCALE_LABELS[e.locale] ?? (e.locale || "Unknown"),
    })),
  );

  const eventTypes = buildBreakdown(
    currentEvents.map((e) => ({
      key: e.event || "unknown",
      label: e.event.replace(/_/g, " ") || "Unknown",
    })),
  );

  const placements = buildBreakdown(
    currentEvents
      .filter((e) => e.placement)
      .map((e) => ({
        key: e.placement,
        label: e.placement,
      })),
  );

  return {
    period,
    kpis: {
      pageViews,
      pageViewsChangePct: changePct(pageViews, prevPageViews),
      uniqueSessions: currentSessions,
      uniqueSessionsChangePct: changePct(currentSessions, previousSessions),
      leads,
      leadsChangePct: changePct(leads, prevLeads),
      conversionRate,
    },
    topPages: buildTopPages(currentPageViews),
    services: buildServices(currentPageViews, currentLeads),
    locales,
    eventTypes,
    placements,
    daily: buildDailySeries(period, currentPageViews, currentLeads),
  };
}

export function emptyMarketingSnapshot(
  period: AnalyticsPeriod,
): MarketingAnalyticsSnapshot {
  return buildMarketingAnalyticsSnapshot(period, { events: [], leads: [] });
}
