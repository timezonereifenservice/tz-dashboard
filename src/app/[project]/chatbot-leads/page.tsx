import { LeadsTable } from "@/components/leads/leads-panel";
import { getAdapter } from "@/lib/adapters/registry";
import { getErrorMessage } from "@/lib/adapters/errors";
import type { UnifiedLead } from "@/lib/adapters/types";
import type { ProjectId } from "@/lib/projects/config";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = { params: Promise<{ project: string }> };

export default async function ChatbotLeadsPage({ params }: PageProps) {
  const { project: slug } = await params;
  const { project } = await requireProjectPageAccess(slug, {
    navItemId: "chatbot-leads",
    feature: "chatbot-leads",
  });

  let leads: UnifiedLead[] = [];
  let error: string | null = null;
  try {
    leads = await getAdapter(project.id as ProjectId).listLeads({
      chatbotOnly: true,
    });
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[chatbot-leads/${slug}]`, e);
  }

  return (
    <LeadsTable
      project={project}
      title="Chatbot Leads"
      description="Automated inquiries captured from the website chatbot widget."
      leads={leads}
      error={error}
    />
  );
}
