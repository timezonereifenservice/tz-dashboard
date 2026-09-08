import type {
  AnalyticsPeriod,
  AnalyticsSnapshot,
  BreakdownRow,
  UnifiedLead,
} from "@/lib/adapters/types";

export type RawAnalyticsEvent = {
  id: string;
  createdAt: string;
  eventType: string;
  path: string;
  ctaId?: string;
  consentValue?: string;
  sessionId?: string;
  visitorId?: string;
  country?: string;
  device?: string;
  browser?: string;
  locale?: string;
};

function periodDays(period: AnalyticsPeriod) {
  return period === "7d" ? 7 : 30;
}

function sinceIso(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function countUniqueVisitors(events: RawAnalyticsEvent[]) {
  const ids = new Set<string>();
  for (const event of events) {
    if (event.eventType !== "page_view") continue;
    const id = event.visitorId || event.sessionId || event.id;
    if (id) ids.add(id);
  }
  return ids.size;
}

function buildBreakdown(
  events: RawAnalyticsEvent[],
  field: "country" | "device" | "browser",
  labelFor: (key: string) => string,
): BreakdownRow[] {
  const buckets = new Map<string, Set<string>>();
  for (const event of events) {
    if (event.eventType !== "page_view") continue;
    const raw = (event[field] || "").trim();
    const key = raw || "unknown";
    const id = event.visitorId || event.sessionId || event.id;
    const set = buckets.get(key) ?? new Set<string>();
    set.add(id);
    buckets.set(key, set);
  }

  const total = [...buckets.values()].reduce((sum, set) => sum + set.size, 0);
  return [...buckets.entries()]
    .map(([key, set]) => ({
      key,
      label: key === "unknown" ? "Unknown" : labelFor(key),
      visitors: set.size,
      sharePct: total ? Math.round((set.size / total) * 100) : 0,
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 12);
}

function normalizePath(path: string) {
  return path.replace(/^\/(en|de|ro)(?=\/|$)/, "") || "/";
}

function humanizeKey(key: string) {
  return key
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildAnalyticsSnapshot(
  period: AnalyticsPeriod,
  events: RawAnalyticsEvent[],
  leads: UnifiedLead[],
): AnalyticsSnapshot {
  const days = periodDays(period);
  const currentSince = sinceIso(days);
  const previousSince = sinceIso(days * 2);

  const currentEvents = events.filter((e) => e.createdAt >= currentSince);
  const previousEvents = events.filter(
    (e) => e.createdAt >= previousSince && e.createdAt < currentSince,
  );

  const currentLeads = leads.filter((l) => l.createdAt >= currentSince);
  const previousLeads = leads.filter(
    (l) => l.createdAt >= previousSince && l.createdAt < currentSince,
  );

  const visitors = countUniqueVisitors(currentEvents);
  const previousVisitors = countUniqueVisitors(previousEvents);
  const leadsCount = currentLeads.length;
  const previousLeadsCount = previousLeads.length;

  const consentEvents = currentEvents.filter((e) => e.eventType === "consent");
  const accepted = consentEvents.filter((e) => e.consentValue === "accepted").length;
  const consentTotal = consentEvents.length;
  const consentRate = consentTotal
    ? Math.round((accepted / consentTotal) * 100)
    : 0;

  const pageViews = currentEvents.filter((e) => e.eventType === "page_view");
  const pathViews = new Map<string, number>();
  for (const evt of pageViews) {
    const path = normalizePath(evt.path);
    pathViews.set(path, (pathViews.get(path) ?? 0) + 1);
  }

  const topPages = [...pathViews.entries()]
    .map(([path, views]) => ({
      path,
      label: humanizeKey(path === "/" ? "Home" : path.replace(/^\//, "")),
      views,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const ctaCounts = new Map<string, number>();
  for (const evt of currentEvents.filter((e) => e.eventType === "cta_click")) {
    const id = evt.ctaId || "unknown";
    ctaCounts.set(id, (ctaCounts.get(id) ?? 0) + 1);
  }

  const leadSources = new Map<string, number>();
  for (const lead of currentLeads) {
    const key = lead.formKey || lead.source || "unknown";
    leadSources.set(key, (leadSources.get(key) ?? 0) + 1);
  }

  return {
    period,
    kpis: {
      visitors,
      leads: leadsCount,
      conversionRate:
        visitors > 0 ? Number(((leadsCount / visitors) * 100).toFixed(2)) : 0,
      consentRate,
      visitorsChangePct: pctChange(visitors, previousVisitors),
      leadsChangePct: pctChange(leadsCount, previousLeadsCount),
    },
    countries: buildBreakdown(currentEvents, "country", (k) => k.toUpperCase()),
    devices: buildBreakdown(currentEvents, "device", (k) => k),
    browsers: buildBreakdown(currentEvents, "browser", (k) => k),
    leadSources: [...leadSources.entries()]
      .map(([formKey, count]) => ({
        formKey,
        label: humanizeKey(formKey),
        leads: count,
        sharePct: leadsCount ? Math.round((count / leadsCount) * 100) : 0,
      }))
      .sort((a, b) => b.leads - a.leads),
    topPages,
    ctas: [...ctaCounts.entries()]
      .map(([id, clicks]) => ({
        id,
        label: humanizeKey(id),
        clicks,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10),
  };
}

export function emptyAnalyticsSnapshot(period: AnalyticsPeriod): AnalyticsSnapshot {
  return {
    period,
    kpis: {
      visitors: 0,
      leads: 0,
      conversionRate: 0,
      consentRate: 0,
      visitorsChangePct: 0,
      leadsChangePct: 0,
    },
    countries: [],
    devices: [],
    browsers: [],
    leadSources: [],
    topPages: [],
    ctas: [],
  };
}

export { sinceIso };
