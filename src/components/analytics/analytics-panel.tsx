"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Alert, Box, Grid } from "@mui/material";
import { BreakdownTable, KpiCard, PageHeader, PeriodToggle } from "@/components/ui/dashboard-ui";
import type { AnalyticsSnapshot } from "@/lib/adapters/types";

type Props = {
  projectSlug: string;
  projectName: string;
  initialPeriod: "7d" | "30d";
  snapshot: AnalyticsSnapshot;
};

export function AnalyticsPanel({
  projectSlug,
  projectName,
  initialPeriod,
  snapshot: initialSnapshot,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") as "7d" | "30d") || initialPeriod;

  function setPeriod(next: "7d" | "30d") {
    router.push(`/${projectSlug}/website-analytics?period=${next}`);
  }

  const snapshot = initialSnapshot;
  const isEmptyPeriod =
    snapshot.kpis.visitors === 0 &&
    snapshot.kpis.leads === 0 &&
    snapshot.topPages.length === 0;

  return (
    <Box>
      <PageHeader
        title="Website Analytics"
        description={`Traffic and conversion data for ${projectName}`}
        actions={<PeriodToggle period={period} onChange={setPeriod} />}
      />

      {isEmptyPeriod ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          No activity recorded in the last {period === "7d" ? "7 days" : "30 days"}.
          {period === "7d" ? " Try switching to 30 days to see older traffic." : null}
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            label="Visitors"
            value={snapshot.kpis.visitors}
            change={snapshot.kpis.visitorsChangePct}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            label="Leads"
            value={snapshot.kpis.leads}
            change={snapshot.kpis.leadsChangePct}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="Conversion Rate" value={`${snapshot.kpis.conversionRate}%`} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard label="Consent Rate" value={`${snapshot.kpis.consentRate}%`} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 0 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <BreakdownTable
            title="Top Countries"
            rows={snapshot.countries.map((r) => ({
              label: r.label,
              value: r.visitors,
              sharePct: r.sharePct,
            }))}
            valueLabel="visitors"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <BreakdownTable
            title="Devices"
            rows={snapshot.devices.map((r) => ({
              label: r.label,
              value: r.visitors,
              sharePct: r.sharePct,
            }))}
            valueLabel="visitors"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <BreakdownTable
            title="Lead Sources"
            rows={snapshot.leadSources.map((r) => ({
              label: r.label,
              value: r.leads,
              sharePct: r.sharePct,
            }))}
            valueLabel="leads"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <BreakdownTable
            title="Top Pages"
            rows={snapshot.topPages.map((r) => ({
              label: r.label,
              value: r.views,
            }))}
            valueLabel="views"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <BreakdownTable
            title="CTA Clicks"
            rows={snapshot.ctas.map((r) => ({
              label: r.label,
              value: r.clicks,
            }))}
            valueLabel="clicks"
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <BreakdownTable
            title="Browsers"
            rows={snapshot.browsers.map((r) => ({
              label: r.label,
              value: r.visitors,
              sharePct: r.sharePct,
            }))}
            valueLabel="visitors"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
