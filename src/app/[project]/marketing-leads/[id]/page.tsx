import { notFound } from "next/navigation";
import { MarketingLeadDetailPanel } from "@/components/marketing/marketing-lead-detail-panel";
import { getMarketingLeadById } from "@/lib/marketing/fetch";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = {
  params: Promise<{ project: string; id: string }>;
};

export default async function MarketingLeadDetailPage({ params }: PageProps) {
  const { project: slug, id } = await params;
  const { project } = await requireProjectPageAccess(slug, {
    navItemId: "marketing-leads",
    feature: "marketing-leads",
  });

  const detail = await getMarketingLeadById(id);
  if (!detail) notFound();

  return <MarketingLeadDetailPanel project={project} detail={detail} />;
}
