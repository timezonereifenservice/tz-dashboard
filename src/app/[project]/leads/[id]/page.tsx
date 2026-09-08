import { notFound } from "next/navigation";
import { LeadDetail } from "@/components/leads/leads-panel";
import { getAdapter } from "@/lib/adapters/registry";
import { getProjectBySlug, type ProjectId } from "@/lib/projects/config";

type PageProps = {
  params: Promise<{ project: string; id: string }>;
};

export default async function LeadDetailPage({ params }: PageProps) {
  const { project: slug, id } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const lead = await getAdapter(project.id as ProjectId).getLead(id);
  if (!lead) notFound();

  return <LeadDetail projectSlug={slug} lead={lead} />;
}
