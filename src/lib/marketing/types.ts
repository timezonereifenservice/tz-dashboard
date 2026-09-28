import type { AnalyticsPeriod } from "@/lib/adapters/types";

export type MarketingAnalyticsEvent = {
  id: string;
  createdAt: string;
  event: string;
  page: string;
  service: string;
  locale: string;
  placement: string;
  sessionId: string;
  path: string;
  referrer: string;
};

export type MarketingLead = {
  id: string;
  createdAt: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  vehicle: string;
  brand: string;
  model: string;
  year: string;
  service: string;
  serviceLabel: string;
  page: string;
  locale: string;
};

export type MarketingBreakdownRow = {
  key: string;
  label: string;
  count: number;
  sharePct: number;
};

export type MarketingPageRow = {
  page: string;
  path: string;
  label: string;
  views: number;
  sessions: number;
  sharePct: number;
};

export type MarketingServiceRow = {
  id: string;
  label: string;
  views: number;
  leads: number;
};

export type MarketingDailyPoint = {
  date: string;
  label: string;
  views: number;
  leads: number;
};

export type MarketingAnalyticsSnapshot = {
  period: AnalyticsPeriod;
  kpis: {
    pageViews: number;
    pageViewsChangePct: number;
    uniqueSessions: number;
    uniqueSessionsChangePct: number;
    leads: number;
    leadsChangePct: number;
    conversionRate: number;
  };
  topPages: MarketingPageRow[];
  services: MarketingServiceRow[];
  locales: MarketingBreakdownRow[];
  eventTypes: MarketingBreakdownRow[];
  placements: MarketingBreakdownRow[];
  daily: MarketingDailyPoint[];
};

export type MarketingAnalyticsRawData = {
  events: MarketingAnalyticsEvent[];
  leads: MarketingLead[];
};
