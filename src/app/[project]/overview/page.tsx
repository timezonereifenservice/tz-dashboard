import { notFound } from "next/navigation";
import {
  OverviewPanel,
  type QuickModule,
} from "@/components/overview/overview-panel";
import { getAdapter } from "@/lib/adapters/registry";
import { EMPTY_OVERVIEW, getErrorMessage } from "@/lib/adapters/errors";
import type { UnifiedLead } from "@/lib/adapters/types";
import { getProjectBySlug, type ProjectId } from "@/lib/projects/config";

type PageProps = { params: Promise<{ project: string }> };

export default async function OverviewPage({ params }: PageProps) {
  const { project: slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  let metrics = EMPTY_OVERVIEW;
  let error: string | null = null;
  let recentLeads: UnifiedLead[] = [];

  try {
    const adapter = getAdapter(project.id as ProjectId);
    metrics = await adapter.getOverviewMetrics();
    const leads = await adapter.listLeads();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    const cutoff = thirtyDaysAgo.toISOString();

    recentLeads = [...leads]
      .filter((lead) => lead.createdAt >= cutoff)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 3);
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[overview/${slug}]`, e);
  }

  const quickModules: QuickModule[] = [
    {
      id: "analytics",
      href: `/${slug}/website-analytics`,
      title: "Website Analytics",
      description:
        "Traffic metrics, visitor origins, and cross-channel funnel performance.",
      icon: "analytics",
    },
    {
      id: "leads",
      href: `/${slug}/leads`,
      title: "Leads Management",
      description: "Review, qualify, and update status for dispatch inquiries.",
      icon: "leads",
      badge:
        metrics.newLeads30d > 0 ? `${metrics.newLeads30d} New` : undefined,
    },
  ];

  if (project.features.includes("chatbot-leads")) {
    quickModules.push({
      id: "chatbot",
      href: `/${slug}/chatbot-leads`,
      title: "Chatbot Inquiries",
      description: "Automated inquiries captured from the website chatbot widget.",
      icon: "chatbot",
    });
  }

  if (project.features.includes("blogs")) {
    quickModules.push({
      id: "blogs",
      href: `/${slug}/blogs`,
      title: "Blog Management",
      description: "Read-only synchronized post listing and CDN staging.",
      icon: "blogs",
    });
  }

  return (
    <OverviewPanel
      project={project}
      metrics={metrics}
      recentLeads={recentLeads}
      error={error}
      quickModules={quickModules}
    />
  );
}
