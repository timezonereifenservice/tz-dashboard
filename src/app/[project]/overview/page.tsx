import Link from "next/link";
import { notFound } from "next/navigation";
import { Box, Button, Grid } from "@mui/material";
import { DbErrorBanner } from "@/components/ui/db-error-banner";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { getAdapter } from "@/lib/adapters/registry";
import { EMPTY_OVERVIEW, getErrorMessage } from "@/lib/adapters/errors";
import { KpiCard, PageHeader } from "@/components/ui/dashboard-ui";
import { getProjectBySlug, type ProjectId } from "@/lib/projects/config";

type PageProps = { params: Promise<{ project: string }> };

export default async function OverviewPage({ params }: PageProps) {
  const { project: slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  let metrics = EMPTY_OVERVIEW;
  let error: string | null = null;
  let blogCount: number | undefined;
  let userCount: number | undefined;

  try {
    const result = await getAdapter(project.id as ProjectId).getOverviewMetrics();
    metrics = result;
    blogCount = result.blogCount;
    userCount = result.userCount;
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[overview/${slug}]`, e);
  }

  const quickLinks = [
    { label: "Website Analytics", href: `/${slug}/website-analytics` },
    { label: "Leads", href: `/${slug}/leads` },
  ];
  if (project.features.includes("blogs")) {
    quickLinks.push({ label: "Blogs", href: `/${slug}/blogs` });
  }
  if (project.features.includes("chatbot-leads")) {
    quickLinks.push({ label: "Chatbot Leads", href: `/${slug}/chatbot-leads` });
  }

  return (
    <Box>
      <PageHeader
        title="Overview"
        description={`Performance snapshot for ${project.name}`}
      />

      {error ? <DbErrorBanner projectName={project.name} message={error} /> : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="Total Leads" value={metrics.totalLeads} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="New Leads (30d)" value={metrics.newLeads30d} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="Visitors (30d)" value={metrics.visitors30d} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="Conversion (30d)" value={`${metrics.conversionRate30d}%`} />
        </Grid>
      </Grid>

      {(blogCount !== undefined || userCount !== undefined) && (
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {blogCount !== undefined ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <KpiCard label="Blog Posts" value={blogCount} />
            </Grid>
          ) : null}
          {userCount !== undefined ? (
            <Grid size={{ xs: 12, sm: 6 }}>
              <KpiCard label="Dashboard Users" value={userCount} hint="In project database" />
            </Grid>
          ) : null}
        </Grid>
      )}

      <Box mt={3}>
        <DashboardCard title="Quick Links">
          <Box display="flex" flexWrap="wrap" gap={1}>
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{ textDecoration: "none" }}>
                <Button variant="outlined" color="primary">
                  {link.label}
                </Button>
              </Link>
            ))}
          </Box>
        </DashboardCard>
      </Box>
    </Box>
  );
}
