import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MarketingAnalyticsPanel } from "@/components/marketing/marketing-analytics-panel";
import { getErrorMessage } from "@/lib/adapters/errors";
import type { AnalyticsPeriod } from "@/lib/adapters/types";
import { emptyMarketingSnapshot } from "@/lib/marketing/snapshot";
import type { MarketingAnalyticsSnapshot } from "@/lib/marketing/types";
import { getProjectBySlug, projectHasFeature } from "@/lib/projects/config";
import { getCachedMarketingAnalyticsSnapshot } from "@/lib/server/cached-metrics";

type PageProps = {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ period?: string }>;
};

export default async function MarketingAnalyticsPage({
  params,
  searchParams,
}: PageProps) {
  const { project: slug } = await params;
  const { period: periodParam } = await searchParams;
  const project = getProjectBySlug(slug);
  if (!project || !projectHasFeature(project, "marketing-analytics")) {
    notFound();
  }

  const period: AnalyticsPeriod = periodParam === "7d" ? "7d" : "30d";

  let snapshot: MarketingAnalyticsSnapshot = emptyMarketingSnapshot(period);
  let error: string | null = null;
  try {
    snapshot = await getCachedMarketingAnalyticsSnapshot(period);
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[marketing-analytics/${slug}]`, e);
  }

  return (
    <Suspense>
      <MarketingAnalyticsPanel
        project={project}
        period={period}
        snapshot={snapshot}
        error={error}
      />
    </Suspense>
  );
}
