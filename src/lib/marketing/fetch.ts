import {
  MARKETING_ANALYTICS_MAX_EVENTS,
  MARKETING_ANALYTICS_MAX_LEADS,
  MARKETING_LIST_LEADS_DEFAULT,
} from "@/lib/adapters/limits";
import { analyticsSinceIso } from "@/lib/adapters/period";
import type { AnalyticsPeriod } from "@/lib/adapters/types";
import { offersQuery } from "@/lib/db/offers-pool";
import {
  marketingCountryLabel,
  marketingEventLabel,
} from "@/lib/marketing/constants";
import { buildMarketingAnalyticsSnapshot } from "@/lib/marketing/snapshot";
import type {
  MarketingAnalyticsEvent,
  MarketingAnalyticsRawData,
  MarketingAnalyticsSnapshot,
  MarketingBreakdownRow,
  MarketingCtaRow,
  MarketingLead,
  MarketingLeadDetail,
  MarketingTimelineEvent,
} from "@/lib/marketing/types";

type EventRow = Record<string, unknown>;
type LeadRow = Record<string, unknown>;
type AggRow = { key: string | null; count: string | number };

function asString(value: unknown) {
  if (value == null) return "";
  return String(value);
}

function asBool(value: unknown) {
  return value === true || value === "true" || value === "t" || value === 1;
}

function mapEvent(row: EventRow): MarketingAnalyticsEvent {
  return {
    id: asString(row.id),
    createdAt: asString(row.createdAt),
    event: asString(row.event),
    page: asString(row.page),
    service: asString(row.service),
    locale: asString(row.locale),
    placement: asString(row.placement),
    sessionId: asString(row.sessionId),
    path: asString(row.path),
    referrer: asString(row.referrer),
    country: asString(row.country),
    city: asString(row.city),
    region: asString(row.region),
    device: asString(row.device),
    browser: asString(row.browser),
    os: asString(row.os),
  };
}

function mapLead(row: LeadRow): MarketingLead {
  const meta =
    row.meta && typeof row.meta === "object"
      ? (row.meta as Record<string, unknown>)
      : {};
  return {
    id: asString(row.id),
    createdAt: asString(row.createdAt),
    name: asString(row.name),
    firstName: asString(row.firstName),
    lastName: asString(row.lastName),
    phone: asString(row.phone),
    email: asString(row.email),
    vehicle: asString(row.vehicle),
    brand: asString(row.brand),
    model: asString(row.model),
    year: asString(row.year),
    hsn: asString(row.hsn),
    tsn: asString(row.tsn),
    vin: asString(row.vin),
    mileage: asString(row.mileage),
    tireSize: asString(row.tireSize),
    preferredDate: asString(row.preferredDate),
    service: asString(row.service),
    serviceLabel: asString(row.serviceLabel),
    page: asString(row.page),
    locale: asString(row.locale),
    sessionId: asString(row.sessionId) || asString(meta.sessionId),
    country: asString(row.country),
    city: asString(row.city),
    region: asString(row.region),
    device: asString(row.device),
    browser: asString(row.browser),
    os: asString(row.os),
    utmSource: asString(row.utmSource),
    utmMedium: asString(row.utmMedium),
    utmCampaign: asString(row.utmCampaign),
    emailSent: asBool(row.emailSent),
    emailError: asString(row.emailError),
    referrer: asString(meta.referrer),
  };
}

function mapAgg(
  rows: AggRow[],
  labelFn: (key: string) => string,
): MarketingBreakdownRow[] {
  return rows
    .map((row) => {
      const key = (row.key || "unknown").trim() || "unknown";
      const count = Number(row.count) || 0;
      return { key, label: labelFn(key), count, sharePct: 0 };
    })
    .filter((row) => row.count > 0);
}

async function fetchBreakdown(
  since: string,
  column: "country" | "city" | "device" | "browser",
  limit: number,
): Promise<MarketingBreakdownRow[]> {
  const { rows } = await offersQuery<AggRow>(
    `SELECT COALESCE(NULLIF(TRIM(${column}), ''), 'unknown') AS key, COUNT(*)::int AS count
     FROM "AnalyticsEvent"
     WHERE "createdAt" >= $1
     GROUP BY 1
     ORDER BY count DESC
     LIMIT $2`,
    [since, limit],
  );

  if (column === "country") {
    return mapAgg(rows, marketingCountryLabel);
  }
  return mapAgg(rows, (key) =>
    key === "unknown" ? "Unknown" : key.replace(/[-_]/g, " "),
  );
}

async function fetchCtaBreakdown(since: string): Promise<MarketingCtaRow[]> {
  const { rows } = await offersQuery<{
    event: string;
    placement: string | null;
    count: string | number;
  }>(
    `SELECT event, COALESCE(NULLIF(TRIM(placement), ''), 'unknown') AS placement, COUNT(*)::int AS count
     FROM "AnalyticsEvent"
     WHERE "createdAt" >= $1
       AND event IN ('click_call','click_whatsapp','click_email','click_form','click_map')
     GROUP BY event, 2
     ORDER BY count DESC
     LIMIT 40`,
    [since],
  );

  return rows.map((row) => {
    const event = asString(row.event);
    const placement = asString(row.placement) || "unknown";
    return {
      key: `${event}:${placement}`,
      event,
      placement,
      label: `${marketingEventLabel(event)} · ${placement}`,
      count: Number(row.count) || 0,
    };
  });
}

async function fetchReferrerBreakdown(since: string): Promise<MarketingBreakdownRow[]> {
  const { rows } = await offersQuery<AggRow>(
    `SELECT COALESCE(NULLIF(TRIM(referrer), ''), 'direct') AS key, COUNT(*)::int AS count
     FROM "AnalyticsEvent"
     WHERE "createdAt" >= $1 AND event = 'page_view'
     GROUP BY 1
     ORDER BY count DESC
     LIMIT 15`,
    [since],
  );

  return mapAgg(rows, (key) => {
    if (key === "direct") return "Direct / none";
    try {
      return new URL(key).hostname || key;
    } catch {
      return key.length > 48 ? `${key.slice(0, 45)}…` : key;
    }
  });
}

const LEAD_SELECT = `id, "createdAt", name, "firstName", "lastName", phone, email, vehicle, brand, model, year,
  hsn, tsn, vin, mileage, "tireSize", "preferredDate",
  service, "serviceLabel", page, locale, "sessionId",
  country, city, region, device, browser, os,
  "utmSource", "utmMedium", "utmCampaign",
  "emailSent", "emailError", meta`;

async function fetchMarketingRawDataInternal(
  period: AnalyticsPeriod,
): Promise<MarketingAnalyticsRawData> {
  const since = analyticsSinceIso(period);

  const [
    eventsRes,
    leadsRes,
    countries,
    cities,
    devices,
    browsers,
    ctas,
    referrers,
  ] = await Promise.all([
    offersQuery<EventRow>(
      `SELECT id, "createdAt", event, page, service, locale, placement, "sessionId", path, referrer,
              country, city, region, device, browser, os
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1
       ORDER BY "createdAt" DESC
       LIMIT $2`,
      [since, MARKETING_ANALYTICS_MAX_EVENTS],
    ),
    offersQuery<LeadRow>(
      `SELECT ${LEAD_SELECT}
       FROM "Lead"
       WHERE "createdAt" >= $1
       ORDER BY "createdAt" DESC
       LIMIT $2`,
      [since, MARKETING_ANALYTICS_MAX_LEADS],
    ),
    fetchBreakdown(since, "country", 20),
    fetchBreakdown(since, "city", 15),
    fetchBreakdown(since, "device", 10),
    fetchBreakdown(since, "browser", 10),
    fetchCtaBreakdown(since),
    fetchReferrerBreakdown(since),
  ]);

  return {
    events: eventsRes.rows.map(mapEvent),
    leads: leadsRes.rows.map(mapLead),
    countries,
    cities,
    devices,
    browsers,
    ctas,
    referrers,
  };
}

export async function fetchMarketingAnalyticsSnapshot(
  period: AnalyticsPeriod,
): Promise<MarketingAnalyticsSnapshot> {
  const raw = await fetchMarketingRawDataInternal(period);
  return buildMarketingAnalyticsSnapshot(period, raw);
}

export async function listMarketingLeads(
  limit = MARKETING_LIST_LEADS_DEFAULT,
): Promise<MarketingLead[]> {
  const { rows } = await offersQuery<LeadRow>(
    `SELECT ${LEAD_SELECT}
     FROM "Lead"
     ORDER BY "createdAt" DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map(mapLead);
}

export async function getMarketingLeadById(
  leadId: string,
): Promise<MarketingLeadDetail | null> {
  const { rows } = await offersQuery<LeadRow>(
    `SELECT ${LEAD_SELECT}
     FROM "Lead"
     WHERE id = $1
     LIMIT 1`,
    [leadId],
  );
  const row = rows[0];
  if (!row) return null;

  const lead = mapLead(row);
  let timeline: MarketingTimelineEvent[] = [];

  if (lead.sessionId) {
    const events = await offersQuery<EventRow>(
      `SELECT id, "createdAt", event, placement, page, path, country, city, device
       FROM "AnalyticsEvent"
       WHERE "sessionId" = $1
       ORDER BY "createdAt" ASC
       LIMIT 200`,
      [lead.sessionId],
    );
    timeline = events.rows.map((event) => ({
      id: asString(event.id),
      createdAt: asString(event.createdAt),
      event: asString(event.event),
      placement: asString(event.placement),
      page: asString(event.page),
      path: asString(event.path),
      country: asString(event.country),
      city: asString(event.city),
      device: asString(event.device),
    }));
  }

  return { lead, timeline };
}
