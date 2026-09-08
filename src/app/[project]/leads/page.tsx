import { notFound } from "next/navigation";
import { LeadsTable } from "@/components/leads/leads-panel";
import { DbErrorBanner } from "@/components/ui/db-error-banner";
import { getAdapter } from "@/lib/adapters/registry";
import type { UnifiedLead } from "@/lib/adapters/types";
import { getErrorMessage } from "@/lib/adapters/errors";
import { getProjectBySlug, type ProjectId } from "@/lib/projects/config";

type PageProps = { params: Promise<{ project: string }> };

export default async function LeadsPage({ params }: PageProps) {
  const { project: slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  let leads: UnifiedLead[] = [];
  let error: string | null = null;
  try {
    leads = await getAdapter(project.id as ProjectId).listLeads();
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[leads/${slug}]`, e);
  }

  return (
    <>
      {error ? <DbErrorBanner projectName={project.name} message={error} /> : null}
      <LeadsTable projectSlug={slug} title="Leads" leads={leads} />
    </>
  );
}
