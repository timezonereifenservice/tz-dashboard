import { LeadsTable } from "@/components/leads/leads-panel";
import { getAdapter } from "@/lib/adapters/registry";
import type { UnifiedLead } from "@/lib/adapters/types";
import { getErrorMessage } from "@/lib/adapters/errors";
import type { ProjectId } from "@/lib/projects/config";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = { params: Promise<{ project: string }> };

export default async function LeadsPage({ params }: PageProps) {
  const { project: slug } = await params;
  const { project } = await requireProjectPageAccess(slug, {
    navItemId: "leads",
    feature: "leads",
  });

  let leads: UnifiedLead[] = [];
  let error: string | null = null;
  try {
    leads = await getAdapter(project.id as ProjectId).listLeads();
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[leads/${slug}]`, e);
  }

  return (
    <LeadsTable
      project={project}
      title="Leads"
      leads={leads}
      error={error}
    />
  );
}
