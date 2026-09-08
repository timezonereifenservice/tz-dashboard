import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AnalyticsPanel } from "@/components/analytics/analytics-panel";
import { DbErrorBanner } from "@/components/ui/db-error-banner";
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

  const period: AnalyticsPeriod =
    periodParam === "7d" ? "7d" : "30d";

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
      {error ? <DbErrorBanner projectName={project.name} message={error} /> : null}
      <AnalyticsPanel
        projectSlug={slug}
        projectName={project.name}
        initialPeriod={period}
        snapshot={snapshot}
      />
    </Suspense>
  );
}
