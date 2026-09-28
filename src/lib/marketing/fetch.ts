import {
  MARKETING_ANALYTICS_MAX_EVENTS,
  MARKETING_ANALYTICS_MAX_LEADS,
  MARKETING_LIST_LEADS_DEFAULT,
} from "@/lib/adapters/limits";
import { analyticsSinceIso } from "@/lib/adapters/period";
import type { AnalyticsPeriod } from "@/lib/adapters/types";
import { offersQuery } from "@/lib/db/offers-pool";
import { buildMarketingAnalyticsSnapshot } from "@/lib/marketing/snapshot";
import type {
  MarketingAnalyticsEvent,
  MarketingAnalyticsRawData,
  MarketingAnalyticsSnapshot,
  MarketingLead,
} from "@/lib/marketing/types";

type EventRow = Record<string, unknown>;
type LeadRow = Record<string, unknown>;

function mapEvent(row: EventRow): MarketingAnalyticsEvent {
  return {
    id: String(row.id),
    createdAt: String(row.createdAt ?? ""),
    event: String(row.event ?? ""),
    page: String(row.page ?? ""),
    service: String(row.service ?? ""),
    locale: String(row.locale ?? ""),
    placement: String(row.placement ?? ""),
    sessionId: String(row.sessionId ?? ""),
    path: String(row.path ?? ""),
    referrer: String(row.referrer ?? ""),
  };
}

function mapLead(row: LeadRow): MarketingLead {
  return {
    id: String(row.id),
    createdAt: String(row.createdAt ?? ""),
    name: String(row.name ?? ""),
    firstName: String(row.firstName ?? ""),
    lastName: String(row.lastName ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    vehicle: String(row.vehicle ?? ""),
    brand: String(row.brand ?? ""),
    model: String(row.model ?? ""),
    year: String(row.year ?? ""),
    service: String(row.service ?? ""),
    serviceLabel: String(row.serviceLabel ?? ""),
    page: String(row.page ?? ""),
    locale: String(row.locale ?? ""),
  };
}

async function fetchMarketingRawDataInternal(
  period: AnalyticsPeriod,
): Promise<MarketingAnalyticsRawData> {
  const since = analyticsSinceIso(period);

  const [eventsRes, leadsRes] = await Promise.all([
    offersQuery<EventRow>(
      `SELECT id, "createdAt", event, page, service, locale, placement, "sessionId", path, referrer
       FROM "AnalyticsEvent"
       WHERE "createdAt" >= $1
       ORDER BY "createdAt" DESC
       LIMIT $2`,
      [since, MARKETING_ANALYTICS_MAX_EVENTS],
    ),
    offersQuery<LeadRow>(
      `SELECT id, "createdAt", name, "firstName", "lastName", phone, email, vehicle, brand, model, year,
              service, "serviceLabel", page, locale
       FROM "Lead"
       WHERE "createdAt" >= $1
       ORDER BY "createdAt" DESC
       LIMIT $2`,
      [since, MARKETING_ANALYTICS_MAX_LEADS],
    ),
  ]);

  return {
    events: eventsRes.rows.map(mapEvent),
    leads: leadsRes.rows.map(mapLead),
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
    `SELECT id, "createdAt", name, "firstName", "lastName", phone, email, vehicle, brand, model, year,
            service, "serviceLabel", page, locale
     FROM "Lead"
     ORDER BY "createdAt" DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map(mapLead);
}
