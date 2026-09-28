import { PageLoadingSkeleton } from "@/components/system";

export default function Loading() {
  return <PageLoadingSkeleton kpiCount={4} tableRows={4} />;
}
