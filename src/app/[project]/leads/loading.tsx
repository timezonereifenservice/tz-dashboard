import { PageLoadingSkeleton } from "@/components/system";

export default function LeadsLoading() {
  return <PageLoadingSkeleton kpiCount={4} tableRows={5} />;
}
