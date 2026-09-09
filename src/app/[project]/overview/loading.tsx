import { PageLoadingSkeleton } from "@/components/system";

export default function OverviewLoading() {
  return <PageLoadingSkeleton kpiCount={4} tableRows={3} />;
}
