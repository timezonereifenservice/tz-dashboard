import { MarketingLeadsPanel } from "@/components/marketing/marketing-leads-panel";
import { getErrorMessage } from "@/lib/adapters/errors";
import { listMarketingLeads } from "@/lib/marketing/fetch";
import type { MarketingLead } from "@/lib/marketing/types";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = { params: Promise<{ project: string }> };

export default async function MarketingLeadsPage({ params }: PageProps) {
  const { project: slug } = await params;
  const { project } = await requireProjectPageAccess(slug, {
    navItemId: "marketing-leads",
    feature: "marketing-leads",
  });

  let leads: MarketingLead[] = [];
  let error: string | null = null;
  try {
    leads = await listMarketingLeads();
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[marketing-leads/${slug}]`, e);
  }

  return (
    <MarketingLeadsPanel project={project} leads={leads} error={error} />
  );
}
