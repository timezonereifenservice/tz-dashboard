import { offersQuery } from "@/lib/db/offers-pool";
import {
  MARKETING_ACTION_EVENT_SQL,
  MARKETING_CTA_EVENT_SQL,
  MARKETING_SERVICE_LABELS,
  marketingCountryLabel,
  marketingEventLabel,
} from "@/lib/marketing/constants";

export type MarketingGaPeriod = "7d" | "30d" | "all";

export type MarketingServiceId = "transmission" | "tyre" | "oil";

const ALL_TIME_SINCE = "1970-01-01T00:00:00.000Z";

function periodWindow(period: MarketingGaPeriod): {
  since: string;
  /** Days to render on the daily chart */
  chartDays: number;
} {
  if (period === "all") {
    return { since: ALL_TIME_SINCE, chartDays: 90 };
  }
  const days = period === "7d" ? 7 : 30;
  return {
    since: new Date(Date.now() - days * 86_400_000).toISOString(),
    chartDays: days,
  };
}

export function resolveMarketingGaPeriod(
  raw: string | undefined | null,
): MarketingGaPeriod {
  if (raw === "7d" || raw === "all") return raw;
  return "30d";
}

export const MARKETING_ACTIVE_SERVICES: Array<{
  id: MarketingServiceId;
  page: string;
  label: string;
  path: string;
}> = [
  {
    id: "transmission",
    page: "getriebespuelung",
    label: MARKETING_SERVICE_LABELS.transmission,
    path: "/lp/getriebespuelung",
  },
  {
    id: "tyre",
    page: "reifenservice",
    label: MARKETING_SERVICE_LABELS.tyre,
    path: "/lp/reifenservice",
  },
  {
    id: "oil",
    page: "oelwechsel",
    label: MARKETING_SERVICE_LABELS.oil,
    path: "/lp/oelwechsel",
  },
];

export type MetricBreakdown = {
  key: string;
  label: string;
  count: number;
  sharePct: number;
};

export type ServiceScorecard = {
  id: MarketingServiceId;
  page: string;
  label: string;
  path: string;
  pageViews: number;
  sessions: number;
  leads: number;
  conversionRate: number;
  callClicks: number;
  whatsappClicks: number;
  formCtas: number;
  mapClicks: number;
  emailClicks: number;
  formStarts: number;
  scrollEngagement: number;
  topCountry: string;
  topCity: string;
  topDevice: string;
};

export type ServiceDetailAnalytics = {
  service: ServiceScorecard;
  countries: MetricBreakdown[];
  cities: MetricBreakdown[];
  devices: MetricBreakdown[];
  browsers: MetricBreakdown[];
  locales: MetricBreakdown[];
  ctas: MetricBreakdown[];
  engagement: MetricBreakdown[];
  referrers: MetricBreakdown[];
  utmCampaigns: MetricBreakdown[];
  daily: Array<{ date: string; label: string; views: number; leads: number }>;
  recentLeads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    createdAt: string;
  }>;
};

export type MarketingGaOverview = {
  period: MarketingGaPeriod;
  totals: {
    pageViews: number;
    sessions: number;
    leads: number;
    conversionRate: number;
    ctaClicks: number;
  };
  services: ServiceScorecard[];
  countries: MetricBreakdown[];
  cities: MetricBreakdown[];
  devices: MetricBreakdown[];
  ctas: MetricBreakdown[];
};

type CountRow = {
  key: string | null;
  count: string | number;
};

function num(value: unknown) {
  return Number(value) || 0;
}

function withShare(rows: MetricBreakdown[]): MetricBreakdown[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;
  return rows.map((row) => ({
    ...row,
    sharePct: Number(((row.count / total) * 100).toFixed(1)),
  }));
}

function mapBreakdown(
  rows: CountRow[],
  labelFn: (key: string) => string,
): MetricBreakdown[] {
  return withShare(
    rows
      .map((row) => {
        const key = (row.key || "unknown").trim() || "unknown";
        return {
          key,
          label: labelFn(key),
          count: num(row.count),
          sharePct: 0,
        };
      })
      .filter((row) => row.count > 0),
  );
}

function serviceFilterSql(alias = "") {
  const prefix = alias ? `${alias}.` : "";
  return `(${prefix}service = $2 OR ${prefix}page = $3)`;
}

async function fetchBreakdownScoped(
  since: string,
  serviceId: string,
  page: string,
  column: "country" | "city" | "device" | "browser" | "locale",
  limit: number,
): Promise<MetricBreakdown[]> {
  const { rows } = await offersQuery<CountRow>(
    `SELECT COALESCE(NULLIF(TRIM(${column}), ''), 'unknown') AS key, COUNT(*)::int AS count
     FROM "AnalyticsEvent"
     WHERE "createdAt" >= $1 AND ${serviceFilterSql()}
     GROUP BY 1
     ORDER BY count DESC
     LIMIT $4`,
    [since, serviceId, page, limit],
  );

  if (column === "country") return mapBreakdown(rows, marketingCountryLabel);
  if (column === "locale") {
    return mapBreakdown(rows, (key) =>
      key === "de" ? "German" : key === "en" ? "English" : key,
    );
  }
  return mapBreakdown(rows, (key) =>
    key === "unknown" ? "Unknown" : key.replace(/[-_]/g, " "),
  );
}

async function fetchGlobalBreakdown(
  since: string,
  column: "country" | "city" | "device",
  limit: number,
): Promise<MetricBreakdown[]> {
  const { rows } = await offersQuery<CountRow>(
    `SELECT COALESCE(NULLIF(TRIM(${column}), ''), 'unknown') AS key, COUNT(*)::int AS count
     FROM "AnalyticsEvent"
     WHERE "createdAt" >= $1
     GROUP BY 1
     ORDER BY count DESC
     LIMIT $2`,
    [since, limit],
  );
  if (column === "country") return mapBreakdown(rows, marketingCountryLabel);
  return mapBreakdown(rows, (key) =>
    key === "unknown" ? "Unknown" : key.replace(/[-_]/g, " "),
  );
}

async function buildScorecard(
  since: string,
  service: (typeof MARKETING_ACTIVE_SERVICES)[number],
): Promise<ServiceScorecard> {
  const [viewsRes, sessionsRes, leadsRes, actionRes, topGeo] = await Promise.all([
    offersQuery<{ count: string | number }>(
      `SELECT COUNT(*)::int AS count FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1 AND event = 'page_view' AND ${serviceFilterSql()}`,
      [since, service.id, service.page],
    ),
    offersQuery<{ count: string | number }>(
      `SELECT COUNT(DISTINCT NULLIF(TRIM("sessionId"), ''))::int AS count
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1 AND event = 'page_view' AND ${serviceFilterSql()}`,
      [since, service.id, service.page],
    ),
    offersQuery<{ count: string | number }>(
      `SELECT COUNT(*)::int AS count FROM "Lead"
       WHERE "createdAt" >= $1 AND ${serviceFilterSql()}`,
      [since, service.id, service.page],
    ),
    offersQuery<{ event: string; count: string | number }>(
      `SELECT event, COUNT(*)::int AS count
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1
         AND ${serviceFilterSql()}
         AND event IN (${MARKETING_CTA_EVENT_SQL},'form_start','scroll_depth')
       GROUP BY event`,
      [since, service.id, service.page],
    ),
    Promise.all([
      fetchBreakdownScoped(since, service.id, service.page, "country", 1),
      fetchBreakdownScoped(since, service.id, service.page, "city", 1),
      fetchBreakdownScoped(since, service.id, service.page, "device", 1),
    ]),
  ]);

  const actionMap = new Map(
    actionRes.rows.map((row) => [row.event, num(row.count)] as const),
  );
  const pageViews = num(viewsRes.rows[0]?.count);
  const sessions = num(sessionsRes.rows[0]?.count);
  const leads = num(leadsRes.rows[0]?.count);

  return {
    id: service.id,
    page: service.page,
    label: service.label,
    path: service.path,
    pageViews,
    sessions,
    leads,
    conversionRate:
      sessions > 0 ? Number(((leads / sessions) * 100).toFixed(2)) : 0,
    callClicks: actionMap.get("click_call") ?? 0,
    whatsappClicks: actionMap.get("click_whatsapp") ?? 0,
    formCtas: actionMap.get("click_form") ?? 0,
    mapClicks: actionMap.get("click_map") ?? 0,
    emailClicks: actionMap.get("click_email") ?? 0,
    formStarts: actionMap.get("form_start") ?? 0,
    scrollEngagement: actionMap.get("scroll_depth") ?? 0,
    topCountry: topGeo[0][0]?.label ?? "—",
    topCity: topGeo[1][0]?.label ?? "—",
    topDevice: topGeo[2][0]?.label ?? "—",
  };
}

export async function fetchMarketingGaOverview(
  period: MarketingGaPeriod,
): Promise<MarketingGaOverview> {
  const { since: currentSince } = periodWindow(period);

  const [services, countries, cities, devices, ctas] = await Promise.all([
    Promise.all(
      MARKETING_ACTIVE_SERVICES.map((service) =>
        buildScorecard(currentSince, service),
      ),
    ),
    fetchGlobalBreakdown(currentSince, "country", 12),
    fetchGlobalBreakdown(currentSince, "city", 12),
    fetchGlobalBreakdown(currentSince, "device", 8),
    offersQuery<{ key: string | null; count: string | number }>(
      `SELECT event AS key, COUNT(*)::int AS count
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1
         AND event IN (${MARKETING_CTA_EVENT_SQL})
       GROUP BY event
       ORDER BY count DESC`,
      [currentSince],
    ).then((res) => mapBreakdown(res.rows, marketingEventLabel)),
  ]);

  const pageViews = services.reduce((sum, s) => sum + s.pageViews, 0);
  const sessions = services.reduce((sum, s) => sum + s.sessions, 0);
  const leads = services.reduce((sum, s) => sum + s.leads, 0);
  const ctaClicks = services.reduce(
    (sum, s) =>
      sum +
      s.callClicks +
      s.whatsappClicks +
      s.formCtas +
      s.mapClicks +
      s.emailClicks,
    0,
  );

  return {
    period,
    totals: {
      pageViews,
      sessions,
      leads,
      conversionRate:
        sessions > 0 ? Number(((leads / sessions) * 100).toFixed(2)) : 0,
      ctaClicks,
    },
    services: services.sort((a, b) => b.leads - a.leads || b.pageViews - a.pageViews),
    countries,
    cities,
    devices,
    ctas,
  };
}

export async function fetchServiceDetailAnalytics(
  period: MarketingGaPeriod,
  serviceId: string,
): Promise<ServiceDetailAnalytics | null> {
  const service = MARKETING_ACTIVE_SERVICES.find((s) => s.id === serviceId);
  if (!service) return null;

  const { since: currentSince, chartDays: days } = periodWindow(period);

  const [
    scorecard,
    countries,
    cities,
    devices,
    browsers,
    locales,
    ctas,
    engagement,
    referrers,
    utmCampaigns,
    viewsDaily,
    leadsDaily,
    recentLeads,
  ] = await Promise.all([
    buildScorecard(currentSince, service),
    fetchBreakdownScoped(currentSince, service.id, service.page, "country", 15),
    fetchBreakdownScoped(currentSince, service.id, service.page, "city", 15),
    fetchBreakdownScoped(currentSince, service.id, service.page, "device", 10),
    fetchBreakdownScoped(currentSince, service.id, service.page, "browser", 10),
    fetchBreakdownScoped(currentSince, service.id, service.page, "locale", 5),
    offersQuery<{ key: string | null; count: string | number }>(
      `SELECT CONCAT(event, ' · ', COALESCE(NULLIF(TRIM(placement), ''), 'unknown')) AS key,
              COUNT(*)::int AS count
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1
         AND ${serviceFilterSql()}
         AND event IN (${MARKETING_CTA_EVENT_SQL})
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 20`,
      [currentSince, service.id, service.page],
    ).then((res) =>
      mapBreakdown(res.rows, (key) => {
        const [event, placement] = key.split(" · ");
        return `${marketingEventLabel(event || key)}${placement ? ` · ${placement}` : ""}`;
      }),
    ),
    offersQuery<{ key: string | null; count: string | number }>(
      `SELECT CONCAT(event, ' · ', COALESCE(NULLIF(TRIM(placement), ''), 'unknown')) AS key,
              COUNT(*)::int AS count
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1
         AND ${serviceFilterSql()}
         AND event IN (${MARKETING_ACTION_EVENT_SQL})
         AND event NOT IN (${MARKETING_CTA_EVENT_SQL})
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 25`,
      [currentSince, service.id, service.page],
    ).then((res) =>
      mapBreakdown(res.rows, (key) => {
        const [event, placement] = key.split(" · ");
        return `${marketingEventLabel(event || key)}${placement ? ` · ${placement}` : ""}`;
      }),
    ),
    offersQuery<{ key: string | null; count: string | number }>(
      `SELECT COALESCE(NULLIF(TRIM(referrer), ''), 'direct') AS key, COUNT(*)::int AS count
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1 AND event = 'page_view' AND ${serviceFilterSql()}
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 12`,
      [currentSince, service.id, service.page],
    ).then((res) =>
      mapBreakdown(res.rows, (key) => {
        if (key === "direct") return "Direct / none";
        try {
          return new URL(key).hostname;
        } catch {
          return key.length > 40 ? `${key.slice(0, 37)}…` : key;
        }
      }),
    ),
    offersQuery<{ key: string | null; count: string | number }>(
      `SELECT COALESCE(NULLIF(TRIM("utmCampaign"), ''), 'none') AS key, COUNT(*)::int AS count
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1 AND ${serviceFilterSql()}
       GROUP BY 1
       ORDER BY count DESC
       LIMIT 12`,
      [currentSince, service.id, service.page],
    ).then((res) =>
      mapBreakdown(res.rows, (key) => (key === "none" ? "No campaign" : key)),
    ),
    offersQuery<{ day: string; count: string | number }>(
      `SELECT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1 AND event = 'page_view' AND ${serviceFilterSql()}
       GROUP BY 1
       ORDER BY 1 ASC`,
      [currentSince, service.id, service.page],
    ),
    offersQuery<{ day: string; count: string | number }>(
      `SELECT TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
       FROM "Lead"
       WHERE "createdAt" >= $1 AND ${serviceFilterSql()}
       GROUP BY 1
       ORDER BY 1 ASC`,
      [currentSince, service.id, service.page],
    ),
    offersQuery<{
      id: string;
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
      phone: string;
      city: string | null;
      country: string | null;
      createdAt: string;
    }>(
      `SELECT id, name, "firstName", "lastName", email, phone, city, country, "createdAt"
       FROM "Lead"
       WHERE "createdAt" >= $1 AND ${serviceFilterSql()}
       ORDER BY "createdAt" DESC
       LIMIT 20`,
      [currentSince, service.id, service.page],
    ),
  ]);

  const viewByDay = new Map(
    viewsDaily.rows.map((row) => [row.day, num(row.count)] as const),
  );
  const leadByDay = new Map(
    leadsDaily.rows.map((row) => [row.day, num(row.count)] as const),
  );
  const daily: ServiceDetailAnalytics["daily"] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    const iso = date.toISOString().slice(0, 10);
    daily.push({
      date: iso,
      label: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
      }).format(date),
      views: viewByDay.get(iso) ?? 0,
      leads: leadByDay.get(iso) ?? 0,
    });
  }

  return {
    service: scorecard,
    countries,
    cities,
    devices,
    browsers,
    locales,
    ctas,
    engagement,
    referrers,
    utmCampaigns,
    daily,
    recentLeads: recentLeads.rows.map((row) => ({
      id: row.id,
      name:
        row.name?.trim() ||
        [row.firstName, row.lastName].filter(Boolean).join(" ") ||
        "Unknown",
      email: row.email || "",
      phone: row.phone || "",
      city: row.city || "",
      country: row.country ? marketingCountryLabel(row.country) : "",
      createdAt: String(row.createdAt),
    })),
  };
}

export function resolveServiceId(raw: string | undefined | null) {
  if (!raw) return null;
  const value = raw.trim().toLowerCase();
  if (value === "tires" || value === "tyres") return "tyre";
  const byId = MARKETING_ACTIVE_SERVICES.find((s) => s.id === value);
  if (byId) return byId.id;
  const byPage = MARKETING_ACTIVE_SERVICES.find((s) => s.page === value);
  return byPage?.id ?? null;
}
