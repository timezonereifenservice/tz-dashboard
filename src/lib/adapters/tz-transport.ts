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
  UnifiedBlog,
  UnifiedLead,
} from "@/lib/adapters/types";

type LeadRow = Record<string, unknown>;
type EventRow = Record<string, unknown>;

const LEAD_SELECT = `id, source, status, "fullName", email, phone, message,
  "serviceName", "formType", form_key, page_path, page_name, form_name, created_at, updated_at`;

function mapLead(row: LeadRow): UnifiedLead {
  return {
    id: String(row.id),
    fullName: String(row.fullName ?? row.full_name ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    status: String(row.status ?? "NEW"),
    source: String(row.source ?? ""),
    formKey: String(row.form_key ?? row.formType ?? row.form_name ?? ""),
    sourcePage: String(row.page_path ?? row.pagePath ?? "/"),
    message: String(row.message ?? ""),
    service: String(row.serviceName ?? row.service_name ?? ""),
    type: String(row.source ?? ""),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    meta: {
      pageName: row.page_name,
      formName: row.form_name,
      formType: row.formType,
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

async function fetchLeads(options?: { chatbotOnly?: boolean }): Promise<UnifiedLead[]> {
  const chatbotOnly = options?.chatbotOnly ?? false;
  const query = chatbotOnly
    ? `SELECT ${LEAD_SELECT} FROM leads WHERE source = 'CHATBOT' ORDER BY created_at DESC LIMIT 5000`
    : `SELECT ${LEAD_SELECT} FROM leads ORDER BY created_at DESC LIMIT 5000`;
  const { rows } = await projectQuery("tz-transport", query);
  return rows.map(mapLead);
}

async function fetchEvents(since: string): Promise<RawAnalyticsEvent[]> {
  const { rows } = await projectQuery<EventRow>(
    "tz-transport",
    `SELECT id, created_at, event_type, path, cta_id, consent_value, session_id, visitor_id, country, device, browser
     FROM analytics_events
     WHERE created_at >= $1
     ORDER BY created_at DESC
     LIMIT 20000`,
    [since],
  );
  return rows.map(mapEvent);
}

export const tzTransportAdapter: ProjectAdapter = {
  async getOverviewMetrics(): Promise<OverviewMetrics> {
    const since = sinceIso(30);
    const [leadsRes, eventsRes, blogsRes, usersRes] = await Promise.all([
      projectQuery("tz-transport", `SELECT COUNT(*)::int AS count FROM leads`),
      projectQuery(
        "tz-transport",
        `SELECT COUNT(DISTINCT COALESCE(NULLIF(visitor_id,''), session_id))::int AS count
         FROM analytics_events
         WHERE event_type = 'page_view' AND created_at >= $1`,
        [since],
      ),
      projectQuery("tz-transport", `SELECT COUNT(*)::int AS count FROM blogs`).catch(() => ({
        rows: [{ count: 0 }],
      })),
      projectQuery("tz-transport", `SELECT COUNT(*)::int AS count FROM users`),
    ]);

    const totalLeads = Number(leadsRes.rows[0]?.count ?? 0);
    const newLeadsRes = await projectQuery(
      "tz-transport",
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
      blogCount: Number(blogsRes.rows[0]?.count ?? 0),
      userCount: Number(usersRes.rows[0]?.count ?? 0),
    };
  },

  async getAnalyticsRawData(period: AnalyticsPeriod) {
    const days = period === "7d" ? 7 : 30;
    const since = sinceIso(days * 2);
    const [events, leads] = await Promise.all([fetchEvents(since), fetchLeads()]);
    return { events, leads };
  },

  async getAnalyticsSnapshot(period: AnalyticsPeriod): Promise<AnalyticsSnapshot> {
    const days = period === "7d" ? 7 : 30;
    const since = sinceIso(days * 2);
    const [events, leads] = await Promise.all([fetchEvents(since), fetchLeads()]);
    if (events.length === 0 && leads.length === 0) {
      return emptyAnalyticsSnapshot(period);
    }
    return buildAnalyticsSnapshot("tz-transport", period, events, leads);
  },

  listLeads: (options) => fetchLeads(options),

  async getLead(id: string) {
    const { rows } = await projectQuery(
      "tz-transport",
      `SELECT ${LEAD_SELECT} FROM leads WHERE id = $1`,
      [id],
    );
    return rows[0] ? mapLead(rows[0]) : null;
  },

  async updateLeadStatus(id: string, status: string) {
    const { rows } = await projectQuery(
      "tz-transport",
      `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING ${LEAD_SELECT}`,
      [status, id],
    );
    if (!rows[0]) throw new Error("Lead not found");
    return mapLead(rows[0]);
  },

  async listBlogs() {
    const { rows } = await projectQuery(
      "tz-transport",
      `SELECT id, title, slug, status, published_at, updated_at, views_count
       FROM blogs ORDER BY updated_at DESC LIMIT 500`,
    );
    return rows.map((row) => ({
      id: String(row.id),
      title: String(row.title ?? ""),
      slug: String(row.slug ?? ""),
      status: String(row.status ?? ""),
      publishedAt: row.published_at ? String(row.published_at) : null,
      updatedAt: String(row.updated_at ?? ""),
      viewCount: Number(row.views_count ?? 0),
    }));
  },

  async getBlog(id: string) {
    const blogs = await tzTransportAdapter.listBlogs!();
    return blogs.find((b) => b.id === id) ?? null;
  },
};
