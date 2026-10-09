import { notFound } from "next/navigation";
import { LeadDetailPanel } from "@/components/leads/lead-detail-panel";
import { getAdapter } from "@/lib/adapters/registry";
import type { ProjectId } from "@/lib/projects/config";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = {
  params: Promise<{ project: string; id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { project: slug, id } = await params;
  const { project } = await requireProjectPageAccess(slug, {
    navItemId: "leads",
    feature: "leads",
  });

  const lead = await getAdapter(project.id as ProjectId).getLead(id);
  if (!lead) notFound();

  return <LeadDetailPanel project={project} lead={lead} />;
}
