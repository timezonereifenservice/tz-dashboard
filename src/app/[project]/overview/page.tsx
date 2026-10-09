import {
  OverviewPanel,
  type QuickModule,
} from "@/components/overview/overview-panel";
import { getAdapter } from "@/lib/adapters/registry";
import { EMPTY_OVERVIEW, getErrorMessage } from "@/lib/adapters/errors";
import type { UnifiedLead } from "@/lib/adapters/types";
import type { ProjectId } from "@/lib/projects/config";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = { params: Promise<{ project: string }> };

export default async function OverviewPage({ params }: PageProps) {
  const { project: slug } = await params;
  const { project } = await requireProjectPageAccess(slug, {
    navItemId: "overview",
    feature: "overview",
  });

  let metrics = EMPTY_OVERVIEW;
  let error: string | null = null;
  let recentLeads: UnifiedLead[] = [];

  try {
    const adapter = getAdapter(project.id as ProjectId);
    [metrics, recentLeads] = await Promise.all([
      adapter.getOverviewMetrics(),
      adapter.getRecentLeads(3),
    ]);
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

  if (project.features.includes("marketing-analytics")) {
    quickModules.push({
      id: "marketing-analytics",
      href: `/${slug}/marketing-analytics`,
      title: "Landing Page Analytics",
      description:
        "Offers landing traffic, conversion events, and campaign performance.",
      icon: "analytics",
    });
  }

  if (project.features.includes("marketing-leads")) {
    quickModules.push({
      id: "marketing-leads",
      href: `/${slug}/marketing-leads`,
      title: "Marketing Leads",
      description: "Leads captured from timezone-reifenservice offers pages.",
      icon: "leads",
    });
  }

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
