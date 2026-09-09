import { PageLoadingSkeleton } from "@/components/system";

export default function BlogsLoading() {
  return <PageLoadingSkeleton kpiCount={4} tableRows={4} />;
}
