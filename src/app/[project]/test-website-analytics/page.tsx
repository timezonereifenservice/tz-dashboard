import { redirect } from "next/navigation";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = {
  params: Promise<{ project: string }>;
  searchParams: Promise<{ period?: string; service?: string }>;
};

/** Preview URL kept for bookmarks — redirects to real marketing analytics. */
export default async function TestWebsiteAnalyticsPage({
  params,
  searchParams,
}: PageProps) {
  const { project: slug } = await params;
  await requireProjectPageAccess(slug, {
    navItemId: "marketing-analytics",
    feature: "marketing-analytics",
  });

  const query = await searchParams;
  const qs = new URLSearchParams();
  if (query.period) qs.set("period", query.period);
  if (query.service) qs.set("service", query.service);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/${slug}/marketing-analytics${suffix}`);
}
