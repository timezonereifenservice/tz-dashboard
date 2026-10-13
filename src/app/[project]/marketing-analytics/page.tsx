import { Suspense } from "react";
import { GaServiceAnalyticsPanel } from "@/components/marketing/ga-service-analytics-panel";
import { getErrorMessage } from "@/lib/adapters/errors";
import {
  fetchMarketingGaOverview,
  fetchServiceDetailAnalytics,
  resolveMarketingGaPeriod,
  resolveServiceId,
  type MarketingGaOverview,
  type ServiceDetailAnalytics,
} from "@/lib/marketing/service-analytics";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ period?: string; service?: string }>;
};

export default async function MarketingAnalyticsPage({
  params,
  searchParams,
}: PageProps) {
  const { project: slug } = await params;
  const { period: periodParam, service: serviceParam } = await searchParams;
  const { project } = await requireProjectPageAccess(slug, {
    navItemId: "marketing-analytics",
    feature: "marketing-analytics",
  });

  const period = resolveMarketingGaPeriod(periodParam);
  const selectedService = resolveServiceId(serviceParam);

  let overview: MarketingGaOverview = {
    period,
    totals: {
      pageViews: 0,
      sessions: 0,
      leads: 0,
      conversionRate: 0,
      ctaClicks: 0,
    },
    services: [],
    countries: [],
    cities: [],
    devices: [],
    ctas: [],
  };
  let detail: ServiceDetailAnalytics | null = null;
  let error: string | null = null;

  try {
    overview = await fetchMarketingGaOverview(period);
    if (selectedService) {
      detail = await fetchServiceDetailAnalytics(period, selectedService);
    }
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[marketing-analytics/${slug}]`, e);
  }

  return (
    <Suspense>
      <GaServiceAnalyticsPanel
        project={project}
        period={period}
        overview={overview}
        detail={detail}
        selectedService={selectedService}
        error={error}
        basePath={`/${project.slug}/marketing-analytics`}
      />
    </Suspense>
  );
}
