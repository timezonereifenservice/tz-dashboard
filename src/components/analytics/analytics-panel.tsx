"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  Calendar,
  Mail,
  ChevronRight,
  Cookie,
  Download,
  Globe,
  Link2,
  MousePointerClick,
  Monitor,
  PieChart,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { AnalyticsTimeSeriesChart } from "@/components/analytics/analytics-time-series-chart";
import { ConnectivityErrorBanner } from "@/components/system";
import { buildAnalyticsView } from "@/lib/adapters/analytics-engine";
import type {
  AnalyticsDailyPoint,
  AnalyticsRawData,
  AnalyticsSnapshot,
} from "@/lib/adapters/types";
import { getProjectMeta } from "@/lib/projects/meta";
import type { ProjectConfig } from "@/lib/projects/config";
import { formatAnalyticsDateRange, formatNumber, formatPct } from "@/lib/utils";
import styles from "./analytics.module.css";

type AnalyticsPanelProps = {
  project: ProjectConfig;
  initialPeriod: "7d" | "30d";
  rawData: AnalyticsRawData;
  error: string | null;
};

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`${styles.changeBadge} ${positive ? "" : styles.changeBadgeDown}`}
    >
      {positive ? <TrendingUp size={14} aria-hidden /> : <ArrowDown size={14} aria-hidden />}
      {formatPct(value)}
    </span>
  );
}

function ShareBar({
  pct,
  variant = "primary",
}: {
  pct: number;
  variant?: "primary" | "secondary" | "muted";
}) {
  const fillClass =
    variant === "secondary"
      ? styles.shareBarFillSecondary
      : variant === "muted"
        ? styles.shareBarFillMuted
        : styles.shareBarFill;

  return (
    <div className={styles.shareCell}>
      <span>{pct}%</span>
      <div className={styles.shareBar}>
        <div className={fillClass} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}

function exportSnapshotCsv(
  projectName: string,
  snapshot: AnalyticsSnapshot,
  dailySeries: AnalyticsDailyPoint[],
) {
  const rows = [
    ["Metric", "Value"],
    ["Period", snapshot.period],
    ["Visitors", String(snapshot.kpis.visitors)],
    ["Leads", String(snapshot.kpis.leads)],
    ["Conversion Rate", `${snapshot.kpis.conversionRate}%`],
    ["Consent Rate", `${snapshot.kpis.consentRate}%`],
    ["CTA Clicks", String(snapshot.kpis.ctaClicks)],
    [],
    ["CTA", "Clicks", "Share %", "CTR %"],
    ...snapshot.ctas.map((row) => [
      row.label,
      String(row.clicks),
      String(row.sharePct),
      `${row.ctrPct}%`,
    ]),
    [],
    ["Country", "Visitors", "Share %"],
    ...snapshot.countries.map((row) => [row.label, String(row.visitors), String(row.sharePct)]),
    [],
    ["Device", "Sessions", "Share %"],
    ...snapshot.devices.map((row) => [row.label, String(row.visitors), String(row.sharePct)]),
    [],
    ["Lead Source", "Leads", "Share %"],
    ...snapshot.leadSources.map((row) => [row.label, String(row.leads), String(row.sharePct)]),
    [],
    ["Page", "Views"],
    ...snapshot.topPages.map((row) => [row.path, String(row.views)]),
    [],
    ["Date", "Visitors", "Leads"],
    ...dailySeries.map((row) => [
      row.date,
      String(row.visitors),
      String(row.leads),
    ]),
  ];

  const csv = rows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-analytics-${snapshot.period}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsPanel({
  project,
  initialPeriod,
  rawData,
  error,
}: AnalyticsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const meta = getProjectMeta(project.id);
  const period = (searchParams.get("period") as "7d" | "30d") || initialPeriod;

  const dateRange = useMemo(() => formatAnalyticsDateRange(period), [period]);

  const analyticsView = useMemo(
    () => buildAnalyticsView(period, rawData.events, rawData.leads),
    [period, rawData.events, rawData.leads],
  );

  const {
    snapshot,
    dailySeries,
    previousVisitors,
    previousLeads,
    previousCtaClicks,
    consentAccepted,
    consentTotal,
  } = analyticsView;

  const isEmptyPeriod =
    snapshot.kpis.visitors === 0 &&
    snapshot.kpis.leads === 0 &&
    snapshot.kpis.ctaClicks === 0 &&
    snapshot.topPages.length === 0;

  const hasChartData = dailySeries.some(
    (point) => point.visitors > 0 || point.leads > 0,
  );

  function setPeriod(next: "7d" | "30d") {
    router.push(`/${project.slug}/website-analytics?period=${next}`);
  }

  const kpis = [
    {
      label: `Visitors (${period === "7d" ? "7d" : "30d"})`,
      value: formatNumber(snapshot.kpis.visitors),
      icon: Users,
      change: snapshot.kpis.visitorsChangePct,
      prevLabel: `${formatNumber(previousVisitors)} prev`,
      accent: "primary" as const,
    },
    {
      label: "Leads Generated",
      value: formatNumber(snapshot.kpis.leads),
      icon: Mail,
      change: snapshot.kpis.leadsChangePct,
      prevLabel: `${formatNumber(previousLeads)} prev`,
      accent: "secondary" as const,
    },
    {
      label: "CTA Clicks",
      value: formatNumber(snapshot.kpis.ctaClicks),
      icon: MousePointerClick,
      change: snapshot.kpis.ctaClicksChangePct,
      prevLabel: `${formatNumber(previousCtaClicks)} prev`,
      accent: "primary" as const,
    },
    {
      label: "Conversion Rate",
      value: `${snapshot.kpis.conversionRate}%`,
      icon: PieChart,
      change: undefined,
      prevLabel: "Qualified traffic",
      accent: "primary" as const,
    },
    {
      label: "Consent Rate (GDPR)",
      value: `${snapshot.kpis.consentRate}%`,
      icon: Cookie,
      change: undefined,
      prevLabel: `${formatNumber(consentAccepted)} of ${formatNumber(consentTotal)} events`,
      accent: "secondary" as const,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.breadcrumb}>
            <span>Console</span>
            <ChevronRight size={14} aria-hidden />
            <span>{project.name}</span>
            <ChevronRight size={14} aria-hidden />
            <span className={styles.breadcrumbActive}>Website Analytics</span>
          </div>
          <h1 className={styles.title}>Website Analytics</h1>
          <p className={styles.description}>
            Real-time telemetry, visitor behavior and conversion funnel for{" "}
            <span className={styles.descriptionAccent}>{meta.domain}</span>
          </p>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.periodToggle}>
            <button
              type="button"
              className={`${styles.periodButton} ${
                period === "7d" ? styles.periodButtonActive : ""
              }`}
              onClick={() => setPeriod("7d")}
            >
              7 days
            </button>
            <button
              type="button"
              className={`${styles.periodButton} ${
                period === "30d" ? styles.periodButtonActive : ""
              }`}
              onClick={() => setPeriod("30d")}
            >
              30 days
            </button>
          </div>
          <div className={styles.dateRange}>
            <Calendar size={18} color="var(--dash-primary-container)" aria-hidden />
            <span>{dateRange}</span>
          </div>
          <button
            type="button"
            className={styles.exportButton}
            onClick={() => exportSnapshotCsv(project.name, snapshot, dailySeries)}
          >
            <Download size={18} aria-hidden />
            Export CSV
          </button>
        </div>
      </div>

      {error ? (
        <ConnectivityErrorBanner
          title={`Could not connect to ${project.name} database`}
          message={error}
          cluster={meta.domain}
          port="5432"
          onRetry={() => router.refresh()}
        />
      ) : null}

      {isEmptyPeriod && !error ? (
        <div className={styles.emptyBanner}>
          No activity recorded in the last {period === "7d" ? "7 days" : "30 days"}.
          {period === "7d" ? " Try switching to 30 days to see older traffic." : null}
        </div>
      ) : null}

      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className={styles.kpiCard}>
              <div
                className={`${styles.kpiAccentTop} ${
                  kpi.accent === "secondary" ? styles.kpiAccentTopSecondary : ""
                }`}
                aria-hidden
              />
              <div className={styles.kpiHead}>
                <div>
                  <div className={styles.kpiLabel}>{kpi.label}</div>
                  <div className={styles.kpiValue}>{kpi.value}</div>
                </div>
                <div
                  className={`${styles.kpiIconWrap} ${
                    kpi.accent === "secondary" ? styles.kpiIconWrapSecondary : ""
                  }`}
                >
                  <Icon size={22} aria-hidden />
                </div>
              </div>
              <div className={styles.kpiFooter}>
                <div>
                  {kpi.change !== undefined ? (
                    <>
                      <TrendBadge value={kpi.change} />
                      <span className={styles.footerHint}> vs prev period</span>
                    </>
                  ) : (
                    <span className={styles.footerHint}>Current period</span>
                  )}
                </div>
                <span
                  className={`${styles.footerMeta} ${
                    kpi.accent === "secondary" ? styles.footerMetaSecondary : ""
                  }`}
                >
                  {kpi.prevLabel}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <section className={styles.chartPanel}>
        <div className={styles.chartHeader}>
          <div>
            <div className={styles.chartTitleRow}>
              <h2 className={styles.chartTitle}>Visitors & Inquiries Over Time</h2>
              <span className={styles.chartBadge}>Daily Cadence</span>
            </div>
            <p className={styles.chartSubtitle}>
              Traffic trend visualization for the selected {period === "7d" ? "7-day" : "30-day"} window
            </p>
          </div>
          <div className={styles.chartLegendWrap}>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <span className={styles.legendLinePrimary} aria-hidden />
                Unique Visitors
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendLineSecondary} aria-hidden />
                Lead Conversions
              </div>
            </div>
          </div>
        </div>
        {!hasChartData ? (
          <div className={styles.chartEmpty}>No chart data for this period yet</div>
        ) : (
          <AnalyticsTimeSeriesChart series={dailySeries} />
        )}
      </section>

      <div className={styles.breakdownGrid}>
        <section className={styles.breakdownCard}>
          <div>
            <div className={styles.breakdownHeader}>
              <div className={styles.breakdownTitleWrap}>
                <div className={styles.breakdownIcon}>
                  <Globe size={20} aria-hidden />
                </div>
                <div>
                  <h3 className={styles.breakdownTitle}>Top Countries & EU Regions</h3>
                  <p className={styles.breakdownSubtitle}>
                    Visitor distribution by geography
                  </p>
                </div>
              </div>
              <span className={styles.cardBadge}>
                {formatNumber(snapshot.kpis.visitors)} Total
              </span>
            </div>
            <div className={styles.tableWrap}>
              {snapshot.countries.length === 0 ? (
                <div className={styles.emptyTable}>No country data yet</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeadRow}>
                      <th>Country / Region</th>
                      <th className={styles.tableHeadRight}>Visitors</th>
                      <th className={styles.tableHeadRight}>Share %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.countries.map((row) => (
                      <tr key={row.key} className={styles.tableRow}>
                        <td>
                          <div className={styles.rowLabel}>
                            <span className={styles.countryCode}>
                              {row.key.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{row.label}</span>
                          </div>
                        </td>
                        <td className={`${styles.tableCellRight} ${styles.tableCellMuted}`}>
                          {formatNumber(row.visitors)}
                        </td>
                        <td className={styles.tableCellRight}>
                          <ShareBar pct={row.sharePct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className={styles.cardFooter}>
            <span>{snapshot.countries.length} active regions</span>
            <span className={styles.cardFooterAccent}>Geographic breakdown</span>
          </div>
        </section>

        <section className={styles.breakdownCard}>
          <div>
            <div className={styles.breakdownHeader}>
              <div className={styles.breakdownTitleWrap}>
                <div className={styles.breakdownIcon}>
                  <Monitor size={20} aria-hidden />
                </div>
                <div>
                  <h3 className={styles.breakdownTitle}>Device & Platform Breakdown</h3>
                  <p className={styles.breakdownSubtitle}>
                    Sessions grouped by device type
                  </p>
                </div>
              </div>
              <span className={styles.cardBadge}>Form Factors</span>
            </div>
            <div className={styles.tableWrap}>
              {snapshot.devices.length === 0 ? (
                <div className={styles.emptyTable}>No device data yet</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeadRow}>
                      <th>Device Type</th>
                      <th className={styles.tableHeadRight}>Sessions</th>
                      <th className={styles.tableHeadRight}>Share %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.devices.map((row, index) => (
                      <tr key={row.key} className={styles.tableRow}>
                        <td>
                          <div className={styles.rowLabel}>
                            {row.label.toLowerCase().includes("mobile") ? (
                              <Smartphone size={18} color="var(--dash-secondary)" aria-hidden />
                            ) : (
                              <Monitor
                                size={18}
                                color={
                                  index === 0
                                    ? "var(--dash-primary-container)"
                                    : "var(--dash-outline)"
                                }
                                aria-hidden
                              />
                            )}
                            <span>{row.label}</span>
                          </div>
                        </td>
                        <td className={`${styles.tableCellRight} ${styles.tableCellMuted}`}>
                          {formatNumber(row.visitors)}
                        </td>
                        <td className={styles.tableCellRight}>
                          <ShareBar
                            pct={row.sharePct}
                            variant={index === 1 ? "secondary" : "primary"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className={styles.cardFooter}>
            <span>Device mix for selected period</span>
            <span className={styles.cardFooterAccent}>Platform insight</span>
          </div>
        </section>

        <section className={styles.breakdownCard}>
          <div>
            <div className={styles.breakdownHeader}>
              <div className={styles.breakdownTitleWrap}>
                <div className={styles.breakdownIcon}>
                  <MousePointerClick size={20} aria-hidden />
                </div>
                <div>
                  <h3 className={styles.breakdownTitle}>Website CTA Performance</h3>
                  <p className={styles.breakdownSubtitle}>
                    Button and call-to-action click tracking across the site
                  </p>
                </div>
              </div>
              <span className={`${styles.cardBadge} ${styles.cardBadgeAccent}`}>
                {formatNumber(snapshot.kpis.ctaClicks)} Clicks
              </span>
            </div>
            <div className={styles.tableWrap}>
              {snapshot.ctas.length === 0 ? (
                <div className={styles.emptyTable}>No CTA click data yet</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeadRow}>
                      <th>CTA Element</th>
                      <th className={styles.tableHeadRight}>Clicks</th>
                      <th className={styles.tableHeadRight}>Share %</th>
                      <th className={styles.tableHeadRight}>CTR %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.ctas.map((row, index) => (
                      <tr key={row.id} className={styles.tableRow}>
                        <td>
                          <div>
                            <div className={styles.pathCode}>{row.label}</div>
                            <div className={styles.pathHint}>{row.id}</div>
                          </div>
                        </td>
                        <td className={`${styles.tableCellRight} ${styles.tableCellMuted}`}>
                          {formatNumber(row.clicks)}
                        </td>
                        <td className={styles.tableCellRight}>
                          <ShareBar
                            pct={row.sharePct}
                            variant={index === 1 ? "secondary" : "primary"}
                          />
                        </td>
                        <td className={styles.tableCellRight}>
                          <span className={styles.ctrValue}>{row.ctrPct}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className={styles.cardFooter}>
            <span>{snapshot.ctas.length} tracked CTAs</span>
            <span className={styles.cardFooterAccent}>Engagement tracking</span>
          </div>
        </section>

        <section className={styles.breakdownCard}>
          <div>
            <div className={styles.breakdownHeader}>
              <div className={styles.breakdownTitleWrap}>
                <div className={styles.breakdownIcon}>
                  <TrendingUp size={20} aria-hidden />
                </div>
                <div>
                  <h3 className={styles.breakdownTitle}>Lead & Traffic Sources</h3>
                  <p className={styles.breakdownSubtitle}>
                    Acquisition channels attributing to inquiries
                  </p>
                </div>
              </div>
              <span className={`${styles.cardBadge} ${styles.cardBadgeAccent}`}>
                {formatNumber(snapshot.kpis.leads)} Inquiries
              </span>
            </div>
            <div className={styles.tableWrap}>
              {snapshot.leadSources.length === 0 ? (
                <div className={styles.emptyTable}>No lead source data yet</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeadRow}>
                      <th>Channel Source</th>
                      <th className={styles.tableHeadRight}>Inquiries</th>
                      <th className={styles.tableHeadRight}>Share %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.leadSources.map((row, index) => (
                      <tr key={row.formKey} className={styles.tableRow}>
                        <td>
                          <span className={styles.pathCode}>{row.label}</span>
                        </td>
                        <td
                          className={`${styles.tableCellRight} ${styles.tableCellMuted}`}
                        >
                          {formatNumber(row.leads)}
                        </td>
                        <td className={styles.tableCellRight}>
                          <ShareBar
                            pct={row.sharePct}
                            variant={index === 2 ? "secondary" : "primary"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className={styles.cardFooter}>
            <span>{snapshot.leadSources.length} tracked channels</span>
            <span className={styles.cardFooterSecondary}>Source attribution</span>
          </div>
        </section>

        <section className={styles.breakdownCard}>
          <div>
            <div className={styles.breakdownHeader}>
              <div className={styles.breakdownTitleWrap}>
                <div className={styles.breakdownIcon}>
                  <Link2 size={20} aria-hidden />
                </div>
                <div>
                  <h3 className={styles.breakdownTitle}>Top Visited Landing Pages</h3>
                  <p className={styles.breakdownSubtitle}>
                    Direct landing performance by page
                  </p>
                </div>
              </div>
              <span className={styles.cardBadge}>
                {snapshot.topPages.length} URLs
              </span>
            </div>
            <div className={styles.tableWrap}>
              {snapshot.topPages.length === 0 ? (
                <div className={styles.emptyTable}>No page data yet</div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeadRow}>
                      <th>Landing Page</th>
                      <th className={styles.tableHeadRight}>Pageviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.topPages.map((row) => (
                      <tr key={row.path} className={styles.tableRow}>
                        <td>
                          <div>
                            <div className={styles.pathCode}>{row.path}</div>
                            <div className={styles.pathHint}>{row.label}</div>
                          </div>
                        </td>
                        <td className={`${styles.tableCellRight} ${styles.tableCellMuted}`}>
                          {formatNumber(row.views)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className={styles.cardFooter}>
            <span>Top entry pages for {meta.domain}</span>
            <span className={styles.cardFooterSecondary}>Landing performance</span>
          </div>
        </section>
      </div>

      <footer className={styles.pageFooter}>
        <div className={styles.pageFooterLeft}>
          <span className={styles.pageFooterDot} aria-hidden />
          <span>Connected to {project.name} analytics pipeline</span>
        </div>
        <div className={styles.pageFooterRight}>
          <span>Period: {period === "7d" ? "7 days" : "30 days"}</span>
          <span>Range: {dateRange}</span>
        </div>
      </footer>
    </div>
  );
}
