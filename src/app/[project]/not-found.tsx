import { NotFoundState } from "@/components/system";

type NotFoundProps = {
  params: Promise<{ project: string }>;
};

export default async function ProjectNotFoundPage({ params }: NotFoundProps) {
  const { project } = await params;

  return (
    <NotFoundState
      backHref={`/${project}/overview`}
      backLabel="Back to Overview"
    />
  );
}
