import { unstable_cache } from "next/cache";
import { getAdapter } from "@/lib/adapters/registry";
import type { AnalyticsPeriod, AnalyticsSnapshot } from "@/lib/adapters/types";
import { fetchMarketingAnalyticsSnapshot } from "@/lib/marketing/fetch";
import type { MarketingAnalyticsSnapshot } from "@/lib/marketing/types";
import type { ProjectId } from "@/lib/projects/config";

const METRICS_REVALIDATE_SECONDS = 60;

export function getCachedNewLeadsCount30d(projectId: ProjectId): Promise<number> {
  return unstable_cache(
    async () => getAdapter(projectId).getNewLeadsCount30d(),
    ["new-leads-30d", projectId],
    { revalidate: METRICS_REVALIDATE_SECONDS, tags: [`metrics-${projectId}`] },
  )();
}

export function getCachedAnalyticsSnapshot(
  projectId: ProjectId,
  period: AnalyticsPeriod,
): Promise<AnalyticsSnapshot> {
  return unstable_cache(
    async () => getAdapter(projectId).getAnalyticsSnapshot(period),
    ["analytics-snapshot", projectId, period],
    {
      revalidate: METRICS_REVALIDATE_SECONDS,
      tags: [`analytics-${projectId}`, `metrics-${projectId}`],
    },
  )();
}

export function getCachedMarketingAnalyticsSnapshot(
  period: AnalyticsPeriod,
): Promise<MarketingAnalyticsSnapshot> {
  return unstable_cache(
    async () => fetchMarketingAnalyticsSnapshot(period),
    ["marketing-analytics-snapshot", period],
    { revalidate: METRICS_REVALIDATE_SECONDS, tags: ["marketing-analytics"] },
  )();
}
