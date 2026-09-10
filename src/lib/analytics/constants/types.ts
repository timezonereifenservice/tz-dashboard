export type ServiceAnalyticsDef = {
  id: string;
  label: string;
  /** Prefix match — used by TZ Transport service landing pages */
  pathPrefixes?: string[];
  /** Exact path match — used by Take & Bring and Reifenservice */
  paths?: string[];
  formKeys: string[];
};

export type ProjectAnalyticsConstants = {
  serviceAnalytics: ServiceAnalyticsDef[];
  ctaLabels: Record<string, string>;
  localeLabels: Record<string, string>;
  pageLabels: Record<string, string>;
};
