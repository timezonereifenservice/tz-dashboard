import { notFound } from "next/navigation";
import { LeadsTable } from "@/components/leads/leads-panel";
import { getAdapter } from "@/lib/adapters/registry";
import type { UnifiedLead } from "@/lib/adapters/types";
import { getProjectBySlug, projectHasFeature, type ProjectId } from "@/lib/projects/config";

type PageProps = { params: Promise<{ project: string }> };

export default async function ChatbotLeadsPage({ params }: PageProps) {
  const { project: slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || !projectHasFeature(project, "chatbot-leads")) notFound();

  let leads: UnifiedLead[] = [];
  try {
    leads = await getAdapter(project.id as ProjectId).listLeads({
      chatbotOnly: true,
    });
  } catch {
    leads = [];
  }

  return (
    <LeadsTable
      project={project}
      title="Chatbot Leads"
      description="Automated inquiries captured from the website chatbot widget."
      leads={leads}
    />
  );
}
