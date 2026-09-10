"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  FileCheck2,
  Globe,
  Layers,
  Monitor,
  PhoneCall,
  Smartphone,
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
import { buildAnalyticsView } from "@/lib/adapters/analytics-engine";
import type { AnalyticsPeriod, AnalyticsRawData } from "@/lib/adapters/types";
import type { ProjectConfig } from "@/lib/projects/config";
import styles from "./analytics.module.css";

type AnalyticsPanelProps = {
  project: ProjectConfig;
  initialPeriod: AnalyticsPeriod;
  rawData: AnalyticsRawData;
  error: string | null;
};

const PERIOD_OPTIONS = [
  { value: "7d" as const, label: "7 days" },
  { value: "30d" as const, label: "30 days" },
];

export function AnalyticsPanel({
  project,
  initialPeriod,
  rawData,
  error,
}: AnalyticsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const period = (searchParams.get("period") === "7d" ? "7d" : initialPeriod) as AnalyticsPeriod;

  const { snapshot } = useMemo(
    () => buildAnalyticsView(project.id, period, rawData.events, rawData.leads),
    [project.id, period, rawData.events, rawData.leads],
  );

  function onChangePeriod(nextPeriod: AnalyticsPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", nextPeriod);
    router.push(`/${project.slug}/website-analytics?${params.toString()}`);
  }

  const kpis = snapshot.kpis;

  return (
    <>
      <DashboardPageHeader
        eyebrow="Web Analytics"
        title="Traffic & Conversion Insights"
        description="Visitors, leads, conversions, CTAs, devices, countries — all from first-party tracking."
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
          title="Could not load analytics"
          message={error}
          onRetry={() => router.refresh()}
        />
      ) : null}

      <div className={styles.kpiGrid}>
        <KpiCard
          icon={Users}
          label="Visitors"
          value={kpis.visitors}
          changePct={kpis.visitorsChangePct}
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
        <KpiCard
          icon={PhoneCall}
          label="Consent Rate"
          value={`${kpis.consentRate}%`}
        />
      </div>

      <div className={styles.grid12}>
        <DashboardCard className={styles.col6}>
          <p className={styles.sectionTitle}>Traffic by Language</p>
          {snapshot.locales.length ? (
            <ul className={styles.list}>
              {snapshot.locales.map((loc) => (
                <li key={loc.locale} className={styles.listRow}>
                  <div className={styles.listLeft}>
                    <Globe size={15} aria-hidden />
                    <span className={styles.listLabel}>{loc.label}</span>
                    <span className={styles.sharePill}>{loc.sharePct}%</span>
                  </div>
                  <div className={styles.listRight}>
                    <span className={styles.listMuted}>
                      {loc.visitors.toLocaleString()} visitors
                    </span>
                    <span className={styles.listStrong}>{loc.leads} leads</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyHint}>No language data in this period.</p>
          )}
        </DashboardCard>

        <BreakdownList
          title="Top Countries"
          icon={Globe}
          items={snapshot.countries}
          className={styles.col6}
        />

        <BreakdownList
          title="Devices"
          icon={Smartphone}
          items={snapshot.devices}
          className={styles.col4}
        />

        <BreakdownList
          title="Browsers"
          icon={Monitor}
          items={snapshot.browsers}
          className={styles.col4}
        />

        <DashboardCard className={styles.col4}>
          <p className={styles.sectionTitle}>Lead Sources</p>
          {snapshot.leadSources.length ? (
            <ul className={styles.list}>
              {snapshot.leadSources.map((src) => (
                <li key={src.formKey} className={styles.listRow}>
                  <span className={styles.listLabel}>{src.label}</span>
                  <div className={styles.listRight}>
                    <span className={styles.listStrong}>{src.leads}</span>
                    <span className={styles.sharePill}>{src.sharePct}%</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyHint}>No leads in period.</p>
          )}
        </DashboardCard>

        <DashboardCard className={styles.col6}>
          <p className={styles.sectionTitle}>Service Demand</p>
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th className={styles.numHead}>Views</th>
                  <th className={styles.numHead}>Leads</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.services.map((svc) => (
                  <tr key={svc.id}>
                    <td>{svc.label}</td>
                    <td className={styles.numCell}>{svc.views.toLocaleString()}</td>
                    <td className={styles.numCellStrong}>{svc.leads}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard className={styles.col6}>
          <p className={styles.sectionTitle}>CTA Performance</p>
          <ul className={styles.ctaPills}>
            {snapshot.ctas
              .filter((cta) => cta.clicks > 0)
              .map((cta) => (
                <li key={cta.id} className={styles.ctaPill}>
                  <Layers size={14} aria-hidden />
                  <span className={styles.ctaPillLabel}>{cta.label}</span>
                  <span className={styles.ctaPillCount}>
                    {cta.clicks.toLocaleString()}
                  </span>
                </li>
              ))}
            {!snapshot.ctas.some((cta) => cta.clicks > 0) ? (
              <li className={styles.emptyHint}>No CTA clicks yet.</li>
            ) : null}
          </ul>
        </DashboardCard>

        <DashboardCard className={styles.col6}>
          <p className={styles.sectionTitle}>Top Pages</p>
          {snapshot.topPages.length ? (
            <ul className={styles.list}>
              {snapshot.topPages.map((page) => (
                <li key={page.path} className={`${styles.listRow} ${styles.topPageRow}`}>
                  <div className={styles.topPageInfo}>
                    <span className={styles.listLabel}>{page.label}</span>
                    <span className={styles.topPagePath} title={page.path}>
                      {page.path}
                    </span>
                  </div>
                  <div className={styles.listRight}>
                    <span className={styles.listMuted}>
                      {page.views.toLocaleString()} views
                    </span>
                    <div className={styles.progressMini}>
                      <div
                        className={styles.progressMiniFill}
                        style={{ width: `${page.engagementRate}%` }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyHint}>No page views yet.</p>
          )}
        </DashboardCard>

        {snapshot.blogs.length ? (
          <DashboardCard className={styles.col6}>
            <p className={styles.sectionTitle}>Blog Performance</p>
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Article</th>
                    <th className={styles.numHead}>Views</th>
                    <th className={styles.numHead}>CTA Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.blogs.map((blog) => (
                    <tr key={blog.slug}>
                      <td>{blog.title}</td>
                      <td className={styles.numCell}>
                        {blog.views.toLocaleString()}
                      </td>
                      <td className={styles.numCellStrong}>{blog.ctaClicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        ) : null}
      </div>
    </>
  );
}
