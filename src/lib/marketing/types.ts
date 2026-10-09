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
  country: string;
  city: string;
  region: string;
  device: string;
  browser: string;
  os: string;
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
  hsn: string;
  tsn: string;
  vin: string;
  mileage: string;
  tireSize: string;
  preferredDate: string;
  service: string;
  serviceLabel: string;
  page: string;
  locale: string;
  sessionId: string;
  country: string;
  city: string;
  region: string;
  device: string;
  browser: string;
  os: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  emailSent: boolean;
  emailError: string;
  referrer: string;
};

export type MarketingTimelineEvent = {
  id: string;
  createdAt: string;
  event: string;
  placement: string;
  page: string;
  path: string;
  country: string;
  city: string;
  device: string;
};

export type MarketingLeadDetail = {
  lead: MarketingLead;
  timeline: MarketingTimelineEvent[];
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

export type MarketingCtaRow = {
  key: string;
  event: string;
  placement: string;
  label: string;
  count: number;
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
  countries: MarketingBreakdownRow[];
  cities: MarketingBreakdownRow[];
  devices: MarketingBreakdownRow[];
  browsers: MarketingBreakdownRow[];
  ctas: MarketingCtaRow[];
  referrers: MarketingBreakdownRow[];
  daily: MarketingDailyPoint[];
};

export type MarketingAnalyticsRawData = {
  events: MarketingAnalyticsEvent[];
  leads: MarketingLead[];
  countries: MarketingBreakdownRow[];
  cities: MarketingBreakdownRow[];
  devices: MarketingBreakdownRow[];
  browsers: MarketingBreakdownRow[];
  ctas: MarketingCtaRow[];
  referrers: MarketingBreakdownRow[];
};
