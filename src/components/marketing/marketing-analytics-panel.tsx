"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  FileCheck2,
  Globe,
  Layers,
  Megaphone,
  Users,
} from "lucide-react";
import { ConnectivityErrorBanner } from "@/components/system";
import {
  BreakdownList,
  DashboardCard,
  DashboardPageHeader,
  KpiCard,
  SegmentedControl,
} from "@/components/ui/tz-dashboard";
import type { AnalyticsPeriod } from "@/lib/adapters/types";
import { MARKETING_SITE } from "@/lib/marketing/constants";
import type { MarketingAnalyticsSnapshot } from "@/lib/marketing/types";
import type { ProjectConfig } from "@/lib/projects/config";
import analyticsStyles from "@/components/analytics/analytics.module.css";

type MarketingAnalyticsPanelProps = {
  project: ProjectConfig;
  period: AnalyticsPeriod;
  snapshot: MarketingAnalyticsSnapshot;
  error: string | null;
};

const PERIOD_OPTIONS = [
  { value: "7d" as const, label: "7 days" },
  { value: "30d" as const, label: "30 days" },
];

export function MarketingAnalyticsPanel({
  project,
  period,
  snapshot,
  error,
}: MarketingAnalyticsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const styles = analyticsStyles;

  function onChangePeriod(nextPeriod: AnalyticsPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", nextPeriod);
    router.push(`/${project.slug}/marketing-analytics?${params.toString()}`);
  }

  const kpis = snapshot.kpis;
  const maxDailyViews = Math.max(1, ...snapshot.daily.map((d) => d.views));

  return (
    <>
      <DashboardPageHeader
        eyebrow="Marketing Pages"
        title="Landing Page Analytics"
        description={`Page views, sessions, and form conversions from ${MARKETING_SITE.domain}.`}
        actions={
          <SegmentedControl
            options={PERIOD_OPTIONS}
            value={period}
            onChange={onChangePeriod}
          />
        }
      />

      {error ? (
        <ConnectivityErrorBanner
          title="Could not load marketing analytics"
          message={error}
          cluster={MARKETING_SITE.domain}
          port="6543"
          onRetry={() => router.refresh()}
        />
      ) : null}

      <div className={styles.kpiGrid}>
        <KpiCard
          icon={Megaphone}
          label="Page Views"
          value={kpis.pageViews}
          changePct={kpis.pageViewsChangePct}
        />
        <KpiCard
          icon={Users}
          label="Unique Sessions"
          value={kpis.uniqueSessions}
          changePct={kpis.uniqueSessionsChangePct}
        />
        <KpiCard
          icon={FileCheck2}
          label="Leads"
          value={kpis.leads}
          changePct={kpis.leadsChangePct}
        />
        <KpiCard
          icon={BarChart3}
          label="Conversion Rate"
          value={`${kpis.conversionRate}%`}
        />
      </div>

      <div className={styles.grid12}>
        <DashboardCard className={styles.col6}>
          <p className={styles.sectionTitle}>Daily Page Views</p>
          {snapshot.daily.some((d) => d.views > 0 || d.leads > 0) ? (
            <ul className={styles.list}>
              {snapshot.daily.map((day) => (
                <li key={day.date} className={styles.listRow}>
                  <div className={styles.listLeft}>
                    <span className={styles.listLabel}>{day.label}</span>
                    {day.leads > 0 ? (
                      <span className={styles.sharePill}>{day.leads} leads</span>
                    ) : null}
                  </div>
                  <div className={styles.listRight}>
                    <span className={styles.listMuted}>
                      {day.views.toLocaleString()} views
                    </span>
                    <div className={styles.progressMini}>
                      <div
                        className={styles.progressMiniFill}
                        style={{
                          width: `${Math.round((day.views / maxDailyViews) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyHint}>No page views in this period yet.</p>
          )}
        </DashboardCard>

        <BreakdownList
          title="Traffic by Language"
          icon={Globe}
          items={snapshot.locales.map((row) => ({
            key: row.key,
            label: row.label,
            visitors: row.count,
            sharePct: row.sharePct,
          }))}
          className={styles.col6}
        />

        <DashboardCard className={styles.col6}>
          <p className={styles.sectionTitle}>Landing Pages</p>
          {snapshot.topPages.length ? (
            <ul className={styles.list}>
              {snapshot.topPages.map((page) => (
                <li key={`${page.page}-${page.path}`} className={`${styles.listRow} ${styles.topPageRow}`}>
                  <div className={styles.topPageInfo}>
                    <span className={styles.listLabel}>{page.label}</span>
                    <span className={styles.topPagePath} title={page.path}>
                      {page.path || page.page}
                    </span>
                  </div>
                  <div className={styles.listRight}>
                    <span className={styles.listMuted}>
                      {page.views.toLocaleString()} views
                    </span>
                    <span className={styles.listStrong}>
                      {page.sessions.toLocaleString()} sessions
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyHint}>No landing page traffic yet.</p>
          )}
        </DashboardCard>

        <DashboardCard className={styles.col6}>
          <p className={styles.sectionTitle}>Service / Offer Demand</p>
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Offer</th>
                  <th className={styles.numHead}>Views</th>
                  <th className={styles.numHead}>Leads</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.services.length ? (
                  snapshot.services.map((svc) => (
                    <tr key={svc.id}>
                      <td>{svc.label}</td>
                      <td className={styles.numCell}>{svc.views.toLocaleString()}</td>
                      <td className={styles.numCellStrong}>{svc.leads}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3}>No data in this period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard className={styles.col6}>
          <p className={styles.sectionTitle}>Event Types</p>
          {snapshot.eventTypes.length ? (
            <ul className={styles.ctaPills}>
              {snapshot.eventTypes.map((row) => (
                <li key={row.key} className={styles.ctaPill}>
                  <Layers size={14} aria-hidden />
                  <span className={styles.ctaPillLabel}>{row.label}</span>
                  <span className={styles.ctaPillCount}>
                    {row.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyHint}>No tracked events yet.</p>
          )}
        </DashboardCard>

        {snapshot.placements.length ? (
          <BreakdownList
            title="Placements"
            icon={Layers}
            items={snapshot.placements.map((row) => ({
              key: row.key,
              label: row.label,
              visitors: row.count,
              sharePct: row.sharePct,
            }))}
            className={styles.col6}
          />
        ) : null}
      </div>
    </>
  );
}
