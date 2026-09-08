import { projectQuery } from "@/lib/db/pools";
import {
  buildAnalyticsSnapshot,
  emptyAnalyticsSnapshot,
  sinceIso,
  type RawAnalyticsEvent,
} from "@/lib/adapters/analytics-engine";
import type {
  AnalyticsPeriod,
  AnalyticsSnapshot,
  OverviewMetrics,
  ProjectAdapter,
  UnifiedLead,
} from "@/lib/adapters/types";

type LeadRow = Record<string, unknown>;
type EventRow = Record<string, unknown>;

const LEAD_SELECT = `id, created_at, updated_at, type, status, form_key, source_page, source_label,
  full_name, email, phone, service, message, source`;

function mapLead(row: LeadRow): UnifiedLead {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    status: String(row.status ?? "NEW"),
    source: String(row.source ?? row.type ?? ""),
    formKey: String(row.form_key ?? ""),
    sourcePage: String(row.source_page ?? "/"),
    message: String(row.message ?? ""),
    service: String(row.service ?? ""),
    type: String(row.type ?? ""),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    meta: {
      sourceLabel: row.source_label,
    },
  };
}

function mapEvent(row: EventRow): RawAnalyticsEvent {
  return {
    id: String(row.id),
    createdAt: String(row.created_at),
    eventType: String(row.event_type),
    path: String(row.path ?? "/"),
    ctaId: String(row.cta_id ?? ""),
    consentValue: String(row.consent_value ?? ""),
    sessionId: String(row.session_id ?? ""),
    visitorId: String(row.visitor_id ?? ""),
    country: String(row.country ?? ""),
    device: String(row.device ?? ""),
    browser: String(row.browser ?? ""),
  };
}

async function fetchLeads(): Promise<UnifiedLead[]> {
  const { rows } = await projectQuery(
    "tz-reifenservice",
    `SELECT ${LEAD_SELECT} FROM leads ORDER BY created_at DESC LIMIT 5000`,
  );
  return rows.map(mapLead);
}

async function fetchEvents(since: string): Promise<RawAnalyticsEvent[]> {
  const { rows } = await projectQuery<EventRow>(
    "tz-reifenservice",
    `SELECT id, created_at, event_type, path, cta_id, consent_value, session_id, visitor_id, country, device, browser
     FROM analytics_events
     WHERE created_at >= $1
     ORDER BY created_at DESC
     LIMIT 20000`,
    [since],
  );
  return rows.map(mapEvent);
}

export const tzReifenserviceAdapter: ProjectAdapter = {
  async getOverviewMetrics(): Promise<OverviewMetrics> {
    const since = sinceIso(30);
    const [leadsRes, eventsRes, usersRes] = await Promise.all([
      projectQuery("tz-reifenservice", `SELECT COUNT(*)::int AS count FROM leads`),
      projectQuery(
        "tz-reifenservice",
        `SELECT COUNT(DISTINCT COALESCE(NULLIF(visitor_id,''), session_id))::int AS count
         FROM analytics_events
         WHERE event_type = 'page_view' AND created_at >= $1`,
        [since],
      ),
      projectQuery("tz-reifenservice", `SELECT COUNT(*)::int AS count FROM users`).catch(() => ({
        rows: [{ count: 0 }],
      })),
    ]);

    const totalLeads = Number(leadsRes.rows[0]?.count ?? 0);
    const newLeadsRes = await projectQuery(
      "tz-reifenservice",
      `SELECT COUNT(*)::int AS count FROM leads WHERE created_at >= $1`,
      [since],
    );
    const newLeads30d = Number(newLeadsRes.rows[0]?.count ?? 0);
    const visitors30d = Number(eventsRes.rows[0]?.count ?? 0);

    return {
      totalLeads,
      newLeads30d,
      visitors30d,
      conversionRate30d:
        visitors30d > 0
          ? Number(((newLeads30d / visitors30d) * 100).toFixed(2))
          : 0,
      userCount: Number(usersRes.rows[0]?.count ?? 0),
    };
  },

  async getAnalyticsSnapshot(period: AnalyticsPeriod): Promise<AnalyticsSnapshot> {
    const days = period === "7d" ? 7 : 30;
    const since = sinceIso(days * 2);
    const [events, leads] = await Promise.all([fetchEvents(since), fetchLeads()]);
    if (events.length === 0 && leads.length === 0) {
      return emptyAnalyticsSnapshot(period);
    }
    return buildAnalyticsSnapshot(period, events, leads);
  },

  listLeads: fetchLeads,

  async getLead(id: string) {
    const { rows } = await projectQuery(
      "tz-reifenservice",
      `SELECT ${LEAD_SELECT} FROM leads WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapLead(rows[0]) : null;
  },

  async updateLeadStatus(id: string, status: string) {
    const { rows } = await projectQuery(
      "tz-reifenservice",
      `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING ${LEAD_SELECT}`,
      [status, id],
    );
    if (!rows[0]) throw new Error("Lead not found");
    return mapLead(rows[0]);
  },
};
