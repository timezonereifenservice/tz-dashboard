import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AnalyticsPanel } from "@/components/analytics/analytics-panel";
import { getAdapter } from "@/lib/adapters/registry";
import { getErrorMessage } from "@/lib/adapters/errors";
import type { AnalyticsPeriod, AnalyticsRawData } from "@/lib/adapters/types";
import { getProjectBySlug, type ProjectId } from "@/lib/projects/config";

type PageProps = {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ period?: string }>;
};

const EMPTY_RAW_DATA: AnalyticsRawData = { events: [], leads: [] };

export default async function WebsiteAnalyticsPage({
  params,
  searchParams,
}: PageProps) {
  const { project: slug } = await params;
  const { period: periodParam } = await searchParams;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const period: AnalyticsPeriod = periodParam === "7d" ? "7d" : "30d";

  let rawData = EMPTY_RAW_DATA;
  let error: string | null = null;
  try {
    rawData = await getAdapter(project.id as ProjectId).getAnalyticsRawData(
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
        rawData={rawData}
        error={error}
      />
    </Suspense>
  );
}
