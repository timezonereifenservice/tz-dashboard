export type AnalyticsPeriod = "7d" | "30d";

export type UnifiedLead = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  formKey: string;
  sourcePage: string;
  message: string;
  service: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  meta: Record<string, unknown>;
};

export type BreakdownRow = {
  key: string;
  label: string;
  visitors: number;
  sharePct: number;
};

export type LocaleTraffic = {
  locale: string;
  label: string;
  visitors: number;
  leads: number;
  sharePct: number;
};

export type ServiceDemandRow = {
  id: string;
  label: string;
  path: string;
  views: number;
  leads: number;
};

export type BlogContentRow = {
  slug: string;
  title: string;
  views: number;
  ctaClicks: number;
};

export type AnalyticsDailyPoint = {
  date: string;
  label: string;
  visitors: number;
  leads: number;
};

export type AnalyticsRawEvent = {
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

export type AnalyticsRawData = {
  events: AnalyticsRawEvent[];
  leads: UnifiedLead[];
};

export type AnalyticsSnapshot = {
  period: AnalyticsPeriod;
  kpis: {
    visitors: number;
    leads: number;
    conversionRate: number;
    consentRate: number;
    ctaClicks: number;
    visitorsChangePct: number;
    leadsChangePct: number;
    ctaClicksChangePct: number;
  };
  countries: BreakdownRow[];
  devices: BreakdownRow[];
  browsers: BreakdownRow[];
  leadSources: Array<{
    formKey: string;
    label: string;
    leads: number;
    sharePct: number;
  }>;
  locales: LocaleTraffic[];
  services: ServiceDemandRow[];
  blogs: BlogContentRow[];
  topPages: Array<{
    path: string;
    label: string;
    views: number;
    engagementRate: number;
  }>;
  ctas: Array<{
    id: string;
    label: string;
    clicks: number;
    sharePct?: number;
    ctrPct?: number;
  }>;
};

export type OverviewMetrics = {
  totalLeads: number;
  newLeads30d: number;
  visitors30d: number;
  conversionRate30d: number;
  blogCount?: number;
  userCount?: number;
};

export type UnifiedBlog = {
  id: string;
  title: string;
  slug: string;
  status: string;
  locale?: string;
  publishedAt: string | null;
  updatedAt: string;
  viewCount?: number;
};

export interface ProjectAdapter {
  getOverviewMetrics(): Promise<OverviewMetrics>;
  getAnalyticsSnapshot(period: AnalyticsPeriod): Promise<AnalyticsSnapshot>;
  getAnalyticsRawData(period: AnalyticsPeriod): Promise<AnalyticsRawData>;
  listLeads(options?: { chatbotOnly?: boolean }): Promise<UnifiedLead[]>;
  getLead(id: string): Promise<UnifiedLead | null>;
  updateLeadStatus(id: string, status: string): Promise<UnifiedLead>;
  listBlogs?(): Promise<UnifiedBlog[]>;
  getBlog?(id: string): Promise<UnifiedBlog | null>;
}
