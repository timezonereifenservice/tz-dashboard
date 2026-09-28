import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AnalyticsPanel } from "@/components/analytics/analytics-panel";
import { emptyAnalyticsSnapshot } from "@/lib/adapters/analytics-engine";
import { getErrorMessage } from "@/lib/adapters/errors";
import type { AnalyticsPeriod, AnalyticsSnapshot } from "@/lib/adapters/types";
import { getProjectBySlug, type ProjectId } from "@/lib/projects/config";
import { getCachedAnalyticsSnapshot } from "@/lib/server/cached-metrics";

type PageProps = {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ period?: string }>;
};

export default async function WebsiteAnalyticsPage({
  params,
  searchParams,
}: PageProps) {
  const { project: slug } = await params;
  const { period: periodParam } = await searchParams;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const period: AnalyticsPeriod = periodParam === "7d" ? "7d" : "30d";

  let snapshot: AnalyticsSnapshot = emptyAnalyticsSnapshot(period);
  let error: string | null = null;
  try {
    snapshot = await getCachedAnalyticsSnapshot(project.id as ProjectId, period);
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[analytics/${slug}]`, e);
  }

  return (
    <Suspense>
      <AnalyticsPanel
        project={project}
        period={period}
        snapshot={snapshot}
        error={error}
      />
    </Suspense>
  );
}
