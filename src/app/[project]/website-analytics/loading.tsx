import { PageLoadingSkeleton } from "@/components/system";

export default function AnalyticsLoading() {
  return <PageLoadingSkeleton kpiCount={4} tableRows={4} />;
}
