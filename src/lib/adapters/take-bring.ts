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
import {
  getTakeBringSupabase,
  isTakeBringSupabaseConfigured,
} from "@/lib/supabase/take-bring";
import { withTakeBringConnection } from "@/lib/adapters/take-bring-connection";

type LeadRow = Record<string, unknown>;
type EventRow = Record<string, unknown>;
type BlogRow = Record<string, unknown>;

const LEAD_SELECT =
  "id, created_at, updated_at, type, status, form_key, source_page, source_label, full_name, email, phone, whatsapp, inquiry_type, message";

function mapLead(row: LeadRow): UnifiedLead {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? row.fullName ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? row.whatsapp ?? ""),
    status: String(row.status ?? "NEW"),
    source: String(row.source ?? row.type ?? ""),
    formKey: String(row.form_key ?? row.formKey ?? ""),
    sourcePage: String(row.source_page ?? row.sourcePage ?? "/"),
    message: String(row.message ?? ""),
    service: String(row.service ?? row.inquiry_type ?? ""),
    type: String(row.type ?? ""),
    createdAt: String(row.created_at ?? row.createdAt ?? ""),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ""),
    meta: {},
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
    locale: String(row.locale ?? ""),
  };
}

async function fetchLeadsSupabase(
  options?: { chatbotOnly?: boolean },
): Promise<UnifiedLead[]> {
  const supabase = getTakeBringSupabase();
  if (!supabase) throw new Error("Take & Bring Supabase is not configured.");

  let query = supabase.from("leads").select(LEAD_SELECT).order("created_at", {
    ascending: false,
  });

  if (options?.chatbotOnly) {
    query = query.or("type.eq.chatbot,form_key.ilike.%chatbot%");
  }

  const { data, error } = await query.limit(5000);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapLead(row as LeadRow));
}

async function fetchLeadsPg(
  options?: { chatbotOnly?: boolean },
): Promise<UnifiedLead[]> {
  const chatbotOnly = options?.chatbotOnly ?? false;
  let query = `SELECT * FROM leads ORDER BY created_at DESC LIMIT 5000`;
  if (chatbotOnly) {
    query = `SELECT * FROM leads WHERE type = 'chatbot' OR form_key ILIKE '%chatbot%' ORDER BY created_at DESC LIMIT 5000`;
  }
  const { rows } = await projectQuery("take-bring", query);
  return rows.map(mapLead);
}

async function fetchLeads(options?: { chatbotOnly?: boolean }) {
  return withTakeBringConnection((mode) =>
    mode === "supabase" ? fetchLeadsSupabase(options) : fetchLeadsPg(options),
  );
}

async function fetchEventsSupabase(since: string): Promise<RawAnalyticsEvent[]> {
  const supabase = getTakeBringSupabase();
  if (!supabase) throw new Error("Take & Bring Supabase is not configured.");

  const { data, error } = await supabase
    .from("analytics_events")
    .select(
      "id, created_at, event_type, path, cta_id, consent_value, session_id, visitor_id, country, device, browser, locale",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20000);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapEvent(row as EventRow));
}

async function fetchEventsPg(since: string): Promise<RawAnalyticsEvent[]> {
  const { rows } = await projectQuery<EventRow>(
    "take-bring",
    `SELECT id, created_at, event_type, path, cta_id, consent_value, session_id, visitor_id, country, device, browser, locale
     FROM analytics_events
     WHERE created_at >= $1
     ORDER BY created_at DESC
     LIMIT 20000`,
    [since],
  );
  return rows.map(mapEvent);
}

async function fetchEvents(since: string) {
  return withTakeBringConnection((mode) =>
    mode === "supabase" ? fetchEventsSupabase(since) : fetchEventsPg(since),
  );
}

async function countSupabase(table: string, since?: string) {
  const supabase = getTakeBringSupabase();
  if (!supabase) throw new Error("Take & Bring Supabase is not configured.");

  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (since) query = query.gte("created_at", since);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export const takeBringAdapter: ProjectAdapter = {
  async getOverviewMetrics(): Promise<OverviewMetrics> {
    const since = sinceIso(30);

    return withTakeBringConnection(async (mode) => {
      if (mode === "supabase") {
        const [totalLeads, newLeads30d, events] = await Promise.all([
          countSupabase("leads"),
          countSupabase("leads", since),
          fetchEventsSupabase(since),
        ]);

        const visitors = new Set<string>();
        for (const e of events) {
          if (e.eventType !== "page_view") continue;
          const id = e.visitorId || e.sessionId;
          if (id) visitors.add(id);
        }

        const [blogCount, userCount] = await Promise.all([
          countSupabase("blogs").catch(() => 0),
          countSupabase("users").catch(() => 0),
        ]);

        const visitors30d = visitors.size;
        return {
          totalLeads,
          newLeads30d,
          visitors30d,
          conversionRate30d:
            visitors30d > 0
              ? Number(((newLeads30d / visitors30d) * 100).toFixed(2))
              : 0,
          blogCount,
          userCount,
        };
      }

      const [leadsRes, eventsRes, blogsRes, usersRes] = await Promise.all([
      projectQuery("take-bring", `SELECT COUNT(*)::int AS count FROM leads`),
      projectQuery(
        "take-bring",
        `SELECT COUNT(DISTINCT COALESCE(NULLIF(visitor_id,''), session_id))::int AS count
         FROM analytics_events
         WHERE event_type = 'page_view' AND created_at >= $1`,
        [since],
      ),
      projectQuery("take-bring", `SELECT COUNT(*)::int AS count FROM blogs`).catch(() => ({
        rows: [{ count: 0 }],
      })),
      projectQuery("take-bring", `SELECT COUNT(*)::int AS count FROM users`).catch(() => ({
        rows: [{ count: 0 }],
      })),
    ]);

    const totalLeads = Number(leadsRes.rows[0]?.count ?? 0);
    const newLeadsRes = await projectQuery(
      "take-bring",
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
    });
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
    return buildAnalyticsSnapshot(period, events, leads);
  },

  listLeads: fetchLeads,

  async getLead(id: string) {
    if (isTakeBringSupabaseConfigured()) {
      const supabase = getTakeBringSupabase()!;
      const { data, error } = await supabase
        .from("leads")
        .select(LEAD_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapLead(data as LeadRow) : null;
    }

    const { rows } = await projectQuery("take-bring", `SELECT * FROM leads WHERE id = $1`, [
      id,
    ]);
    return rows[0] ? mapLead(rows[0]) : null;
  },

  async updateLeadStatus(id: string, status: string) {
    if (isTakeBringSupabaseConfigured()) {
      const supabase = getTakeBringSupabase()!;
      const { data, error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id)
        .select(LEAD_SELECT)
        .single();
      if (error) throw new Error(error.message);
      return mapLead(data as LeadRow);
    }

    const { rows } = await projectQuery(
      "take-bring",
      `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id],
    );
    if (!rows[0]) throw new Error("Lead not found");
    return mapLead(rows[0]);
  },

  async listBlogs() {
    if (isTakeBringSupabaseConfigured()) {
      const supabase = getTakeBringSupabase()!;
      const { data, error } = await supabase
        .from("blogs")
        .select("id, title, slug, status, published_at, updated_at, views_count")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => ({
        id: String(row.id),
        title: String(row.title ?? ""),
        slug: String(row.slug ?? ""),
        status: String(row.status ?? ""),
        publishedAt: row.published_at ? String(row.published_at) : null,
        updatedAt: String(row.updated_at ?? ""),
        viewCount: Number(row.views_count ?? 0),
      }));
    }

    const { rows } = await projectQuery<BlogRow>(
      "take-bring",
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
    const blogs = await takeBringAdapter.listBlogs!();
    return blogs.find((b) => b.id === id) ?? null;
  },
};
