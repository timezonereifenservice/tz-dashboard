import {
  getAnalyticsConstants,
  normalizeAnalyticsPath,
  pathMatchesService,
  serviceIdForPath,
  servicePathLabel,
} from "@/lib/analytics/constants";
import type { ServiceAnalyticsDef } from "@/lib/analytics/constants";
import type { ProjectId } from "@/lib/projects/config";
import type {
  AnalyticsDailyPoint,
  AnalyticsPeriod,
  AnalyticsSnapshot,
  BlogContentRow,
  BreakdownRow,
  LocaleTraffic,
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

function dayBoundsUtc(offsetDays: number) {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - offsetDays);

  const end = new Date(start);
  end.setUTCHours(23, 59, 59, 999);

  return { start: start.toISOString(), end: end.toISOString() };
}

function formatDayLabel(dateIso: string) {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
  }).format(date);
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
  return normalizeAnalyticsPath(path);
}

function countServiceLeads(
  leads: UnifiedLead[],
  service: ServiceAnalyticsDef,
): number {
  return leads.filter((lead) => {
    if (
      service.formKeys.some(
        (key) => key && (lead.formKey === key || lead.source === key),
      )
    ) {
      return true;
    }
    if (lead.sourcePage && pathMatchesService(lead.sourcePage, service)) {
      return true;
    }
    return false;
  }).length;
}

function localeFromPath(path: string): string {
  if (path.startsWith("/en/") || path === "/en") return "en";
  if (path.startsWith("/ro/") || path === "/ro") return "ro";
  return "de";
}

function findPageLabel(
  path: string,
  pageLabels: Record<string, string>,
): string | null {
  const keys = Object.keys(pageLabels).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (path.startsWith(`${key}/`) || path === key) {
      return pageLabels[key] ?? null;
    }
  }
  return null;
}

function humanizeKey(key: string) {
  return key
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildLocales(
  events: RawAnalyticsEvent[],
  leads: UnifiedLead[],
  localeLabels: Record<string, string>,
): LocaleTraffic[] {
  const visitorMap = new Map<string, Set<string>>();
  for (const event of events) {
    if (event.eventType !== "page_view") continue;
    const locale =
      event.locale?.trim() ||
      localeFromPath(event.path) ||
      "de";
    const id = event.visitorId || event.sessionId || event.id;
    const set = visitorMap.get(locale) ?? new Set<string>();
    set.add(id);
    visitorMap.set(locale, set);
  }

  const leadMap = new Map<string, number>();
  for (const lead of leads) {
    const locale = localeFromPath(lead.sourcePage || "") || "de";
    leadMap.set(locale, (leadMap.get(locale) ?? 0) + 1);
  }

  const locales = [...new Set([...visitorMap.keys(), ...leadMap.keys()])];
  const totalVisitors = locales.reduce(
    (sum, locale) => sum + (visitorMap.get(locale)?.size ?? 0),
    0,
  );

  return locales
    .map((locale) => {
      const visitors = visitorMap.get(locale)?.size ?? 0;
      return {
        locale,
        label: localeLabels[locale] ?? humanizeKey(locale),
        visitors,
        leads: leadMap.get(locale) ?? 0,
        sharePct: totalVisitors
          ? Math.round((visitors / totalVisitors) * 100)
          : 0,
      };
    })
    .sort((a, b) => b.visitors - a.visitors);
}

function buildBlogPerformance(events: RawAnalyticsEvent[]): BlogContentRow[] {
  const blogPattern = /^\/(?:en|de|ro)?\/?blogs?\//i;
  const slugMap = new Map<string, { views: number; ctaClicks: number }>();

  for (const event of events) {
    if (!blogPattern.test(event.path)) continue;
    const match = event.path.match(/\/(?:en|de|ro)?\/?blogs?\/([^/?#]+)/i);
    const slug = match?.[1];
    if (!slug) continue;

    const entry = slugMap.get(slug) ?? { views: 0, ctaClicks: 0 };
    if (event.eventType === "page_view") entry.views += 1;
    if (event.eventType === "cta_click") entry.ctaClicks += 1;
    slugMap.set(slug, entry);
  }

  return [...slugMap.entries()]
    .map(([slug, stats]) => ({
      slug,
      title: slug
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
      views: stats.views,
      ctaClicks: stats.ctaClicks,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);
}

export function buildDailySeries(
  period: AnalyticsPeriod,
  events: RawAnalyticsEvent[],
  leads: UnifiedLead[],
): AnalyticsDailyPoint[] {
  const days = periodDays(period);
  const series: AnalyticsDailyPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const { start, end } = dayBoundsUtc(offset);
    const date = start.slice(0, 10);
    const dayEvents = events.filter(
      (event) => event.createdAt >= start && event.createdAt <= end,
    );
    const dayLeads = leads.filter(
      (lead) => lead.createdAt >= start && lead.createdAt <= end,
    );

    series.push({
      date,
      label: formatDayLabel(date),
      visitors: countUniqueVisitors(dayEvents),
      leads: dayLeads.length,
    });
  }

  return series;
}

export type AnalyticsView = {
  snapshot: AnalyticsSnapshot;
  dailySeries: AnalyticsDailyPoint[];
  previousVisitors: number;
  previousLeads: number;
  previousCtaClicks: number;
  consentAccepted: number;
  consentTotal: number;
};

export function buildAnalyticsView(
  projectId: ProjectId,
  period: AnalyticsPeriod,
  events: RawAnalyticsEvent[],
  leads: UnifiedLead[],
): AnalyticsView {
  const days = periodDays(period);
  const currentSince = sinceIso(days);
  const previousSince = sinceIso(days * 2);

  const currentEvents = events.filter((event) => event.createdAt >= currentSince);
  const previousEvents = events.filter(
    (event) =>
      event.createdAt >= previousSince && event.createdAt < currentSince,
  );
  const currentLeads = leads.filter((lead) => lead.createdAt >= currentSince);
  const previousLeads = leads.filter(
    (lead) =>
      lead.createdAt >= previousSince && lead.createdAt < currentSince,
  );

  const consentEvents = currentEvents.filter(
    (event) => event.eventType === "consent",
  );
  const consentAccepted = consentEvents.filter(
    (event) => event.consentValue === "accepted",
  ).length;

  return {
    snapshot: buildAnalyticsSnapshot(projectId, period, events, leads),
    dailySeries: buildDailySeries(period, events, leads),
    previousVisitors: countUniqueVisitors(previousEvents),
    previousLeads: previousLeads.length,
    previousCtaClicks: previousEvents.filter(
      (event) => event.eventType === "cta_click",
    ).length,
    consentAccepted,
    consentTotal: consentEvents.length,
  };
}

export function buildAnalyticsSnapshot(
  projectId: ProjectId,
  period: AnalyticsPeriod,
  events: RawAnalyticsEvent[],
  leads: UnifiedLead[],
): AnalyticsSnapshot {
  const constants = getAnalyticsConstants(projectId);
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
  const pageStats = new Map<
    string,
    { views: number; sessions: Set<string> }
  >();

  for (const evt of pageViews) {
    const path = normalizePath(evt.path);
    const entry = pageStats.get(path) ?? { views: 0, sessions: new Set() };
    entry.views += 1;
    const sessionId = evt.sessionId || evt.visitorId || evt.id;
    entry.sessions.add(sessionId);
    pageStats.set(path, entry);
  }

  const serviceViewCounts = new Map<string, number>();
  for (const [path, stats] of pageStats.entries()) {
    const serviceId = serviceIdForPath(path, constants.serviceAnalytics);
    if (serviceId) {
      serviceViewCounts.set(
        serviceId,
        (serviceViewCounts.get(serviceId) ?? 0) + stats.views,
      );
    }
  }

  const formLeadMap = new Map<string, number>();
  for (const lead of currentLeads) {
    const key = lead.formKey || lead.source || "unknown";
    formLeadMap.set(key, (formLeadMap.get(key) ?? 0) + 1);
  }

  const services = constants.serviceAnalytics.map((service) => ({
    id: service.id,
    label: service.label,
    path: servicePathLabel(service),
    views: serviceViewCounts.get(service.id) ?? 0,
    leads: countServiceLeads(currentLeads, service),
  }));

  const topPages = [...pageStats.entries()]
    .map(([path, stats]) => ({
      path,
      label:
        findPageLabel(path, constants.pageLabels) ||
        humanizeKey(path === "/" ? "Home" : path.replace(/^\//, "")),
      views: stats.views,
      engagementRate: stats.sessions.size
        ? Math.min(100, Math.round((stats.views / stats.sessions.size) * 40))
        : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const ctaEventTypes = new Set([
    "cta_click",
    "phone_click",
    "whatsapp_click",
    "mailto_click",
  ]);
  const ctaCounts = new Map<string, number>();
  for (const evt of currentEvents) {
    if (!ctaEventTypes.has(evt.eventType)) continue;
    let id = evt.ctaId || "unknown";
    if (evt.eventType === "phone_click") id = "call";
    if (evt.eventType === "whatsapp_click") id = "whatsapp";
    if (evt.eventType === "mailto_click") id = "contact";
    ctaCounts.set(id, (ctaCounts.get(id) ?? 0) + 1);
  }

  const previousCtaEvents = previousEvents.filter((e) =>
    ctaEventTypes.has(e.eventType),
  );
  const ctaClicks = [...ctaCounts.values()].reduce((sum, n) => sum + n, 0);
  const previousCtaClicks = previousCtaEvents.length;

  const ctas = Object.keys(constants.ctaLabels).map((id) => ({
    id,
    label: constants.ctaLabels[id] ?? humanizeKey(id),
    clicks: ctaCounts.get(id) ?? 0,
  }));

  const leadSources = [...formLeadMap.entries()]
    .map(([formKey, count]) => ({
      formKey,
      label: humanizeKey(formKey),
      leads: count,
      sharePct: leadsCount ? Math.round((count / leadsCount) * 100) : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  return {
    period,
    kpis: {
      visitors,
      leads: leadsCount,
      conversionRate:
        visitors > 0 ? Number(((leadsCount / visitors) * 100).toFixed(2)) : 0,
      consentRate,
      ctaClicks,
      visitorsChangePct: pctChange(visitors, previousVisitors),
      leadsChangePct: pctChange(leadsCount, previousLeadsCount),
      ctaClicksChangePct: pctChange(ctaClicks, previousCtaClicks),
    },
    locales: buildLocales(currentEvents, currentLeads, constants.localeLabels),
    countries: buildBreakdown(currentEvents, "country", (k) => k.toUpperCase()),
    devices: buildBreakdown(currentEvents, "device", (k) => k),
    browsers: buildBreakdown(currentEvents, "browser", (k) => k),
    leadSources,
    services,
    blogs: buildBlogPerformance(currentEvents),
    topPages,
    ctas,
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
      ctaClicks: 0,
      visitorsChangePct: 0,
      leadsChangePct: 0,
      ctaClicksChangePct: 0,
    },
    locales: [],
    countries: [],
    devices: [],
    browsers: [],
    leadSources: [],
    services: [],
    blogs: [],
    topPages: [],
    ctas: [],
  };
}

export { sinceIso };
