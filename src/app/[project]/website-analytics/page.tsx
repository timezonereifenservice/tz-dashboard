import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AnalyticsPanel } from "@/components/analytics/analytics-panel";
import { getAdapter } from "@/lib/adapters/registry";
import { emptyAnalyticsSnapshot } from "@/lib/adapters/analytics-engine";
import { getErrorMessage } from "@/lib/adapters/errors";
import type { AnalyticsPeriod } from "@/lib/adapters/types";
import { getProjectBySlug, type ProjectId } from "@/lib/projects/config";

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

  let snapshot = emptyAnalyticsSnapshot(period);
  let error: string | null = null;
  try {
    snapshot = await getAdapter(project.id as ProjectId).getAnalyticsSnapshot(
      period,
    );
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[analytics/${slug}]`, e);
  }

  return (
    <Suspense>
      <AnalyticsPanel
        project={project}
        initialPeriod={period}
        snapshot={snapshot}
        error={error}
      />
    </Suspense>
  );
}
