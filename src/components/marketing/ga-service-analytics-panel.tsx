"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  FileCheck2,
  Globe,
  MapPin,
  Megaphone,
  MousePointerClick,
  Smartphone,
  Users,
} from "lucide-react";
import { ConnectivityErrorBanner } from "@/components/system";
import {
  DashboardCard,
  DashboardPageHeader,
  KpiCard,
  SegmentedControl,
} from "@/components/ui/tz-dashboard";
import { MARKETING_SITE } from "@/lib/marketing/constants";
import type {
  MarketingGaOverview,
  MarketingGaPeriod,
  MetricBreakdown,
  ServiceDetailAnalytics,
} from "@/lib/marketing/service-analytics";
import type { ProjectConfig } from "@/lib/projects/config";
import { formatDate } from "@/lib/utils";
import styles from "./ga-service-analytics.module.css";

type Props = {
  project: ProjectConfig;
  period: MarketingGaPeriod;
  overview: MarketingGaOverview;
  detail: ServiceDetailAnalytics | null;
  selectedService: string | null;
  error: string | null;
  /** Preview route base, e.g. /tz-reifenservice/test-website-analytics */
  basePath: string;
  previewNote?: string;
};

const PERIOD_OPTIONS = [
  { value: "7d" as const, label: "7 days" },
  { value: "30d" as const, label: "30 days" },
  { value: "all" as const, label: "All time" },
];

function BreakdownCard({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: typeof Globe;
  items: MetricBreakdown[];
}) {
  return (
    <DashboardCard>
      <p className={styles.sectionTitle}>
        <Icon size={14} aria-hidden style={{ display: "inline", marginRight: 6 }} />
        {title}
      </p>
      {items.length ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.key} className={styles.listRow}>
              <span className={styles.listLabel}>{item.label}</span>
              <div className={styles.listRight}>
                <span className={styles.listCount}>
                  {item.count.toLocaleString()}
                </span>
                <span className={styles.listShare}>{item.sharePct}%</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No data in this period.</p>
      )}
    </DashboardCard>
  );
}

export function GaServiceAnalyticsPanel({
  project,
  period,
  overview,
  detail,
  selectedService,
  error,
  basePath,
  previewNote,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function pushParams(next: {
    period?: MarketingGaPeriod;
    service?: string | null;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.period) params.set("period", next.period);
    if (next.service === null) params.delete("service");
    else if (next.service) params.set("service", next.service);
    router.push(`${basePath}?${params.toString()}`);
  }

  if (detail && selectedService) {
    const maxViews = Math.max(1, ...detail.daily.map((d) => d.views));
    const s = detail.service;

    return (
      <div className={styles.page}>
        <div className={styles.backRow}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => pushParams({ service: null })}
          >
            <ArrowLeft size={14} aria-hidden />
            All services
          </button>
          <SegmentedControl
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(nextPeriod) => pushParams({ period: nextPeriod })}
          />
        </div>

        <DashboardPageHeader
          eyebrow="Service detail"
          title={s.label}
          description={`${s.path} · ${MARKETING_SITE.domain}`}
        />

        {previewNote ? <p className={styles.note}>{previewNote}</p> : null}

        {error ? (
          <ConnectivityErrorBanner
            title="Could not load service analytics"
            message={error}
            cluster={MARKETING_SITE.domain}
            port="6543"
            onRetry={() => router.refresh()}
          />
        ) : null}

        <div className={styles.kpiGrid}>
          <KpiCard icon={Megaphone} label="Page Views" value={s.pageViews} />
          <KpiCard icon={Users} label="Sessions" value={s.sessions} />
          <KpiCard icon={FileCheck2} label="Form Leads" value={s.leads} />
          <KpiCard
            icon={BarChart3}
            label="Conversion"
            value={`${s.conversionRate}%`}
          />
          <KpiCard
            icon={MousePointerClick}
            label="CTA Clicks"
            value={
              s.callClicks +
              s.whatsappClicks +
              s.formCtas +
              s.mapClicks +
              s.emailClicks
            }
          />
        </div>

        <div className={styles.ctaMini}>
          <span className={styles.ctaChip}>Call {s.callClicks}</span>
          <span className={styles.ctaChip}>WhatsApp {s.whatsappClicks}</span>
          <span className={styles.ctaChip}>Form CTA {s.formCtas}</span>
          <span className={styles.ctaChip}>Map {s.mapClicks}</span>
          <span className={styles.ctaChip}>Email {s.emailClicks}</span>
          <span className={styles.ctaChip}>Form start {s.formStarts}</span>
          <span className={styles.ctaChip}>Scroll {s.scrollEngagement}</span>
        </div>

        <div className={styles.grid2}>
          <BreakdownCard title="Countries" icon={Globe} items={detail.countries} />
          <BreakdownCard title="Cities" icon={MapPin} items={detail.cities} />
          <BreakdownCard title="Devices" icon={Smartphone} items={detail.devices} />
          <BreakdownCard title="Browsers" icon={Smartphone} items={detail.browsers} />
          <BreakdownCard title="Languages" icon={Globe} items={detail.locales} />
          <BreakdownCard title="CTA placements" icon={MousePointerClick} items={detail.ctas} />
          <BreakdownCard
            title="Engagement & actions"
            icon={BarChart3}
            items={detail.engagement}
          />
          <BreakdownCard title="Referrers" icon={Megaphone} items={detail.referrers} />
          <BreakdownCard
            title="UTM campaigns"
            icon={BarChart3}
            items={detail.utmCampaigns}
          />
        </div>

        <div className={styles.grid2}>
          <DashboardCard>
            <p className={styles.sectionTitle}>Daily views & leads</p>
            <ul className={styles.dailyList}>
              {detail.daily.map((day) => (
                <li key={day.date} className={styles.dailyRow}>
                  <span className={styles.listLabel}>{day.label}</span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.round((day.views / maxViews) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className={styles.listShare}>
                    {day.views}v · {day.leads}L
                  </span>
                </li>
              ))}
            </ul>
          </DashboardCard>

          <DashboardCard>
            <p className={styles.sectionTitle}>Recent form submissions</p>
            {detail.recentLeads.length ? (
              detail.recentLeads.map((lead) => (
                <div key={lead.id} className={styles.leadRow}>
                  <Link
                    href={`/${project.slug}/marketing-leads/${lead.id}`}
                    className={styles.leadName}
                  >
                    {lead.name}
                  </Link>
                  <div className={styles.leadMeta}>
                    {[lead.email || null, lead.phone || null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  <div className={styles.leadMeta}>
                    {[
                      lead.city || null,
                      lead.country || null,
                      formatDate(lead.createdAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              ))
            ) : (
              <p className={styles.empty}>No leads for this service in period.</p>
            )}
          </DashboardCard>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <DashboardPageHeader
        eyebrow="Ads landing pages"
        title="Service Analytics"
        description={`Google Analytics–style overview by service ad · ${MARKETING_SITE.domain}`}
        actions={
          <SegmentedControl
            options={PERIOD_OPTIONS}
            value={period}
            onChange={(nextPeriod) => pushParams({ period: nextPeriod })}
          />
        }
      />

      {previewNote ? <p className={styles.note}>{previewNote}</p> : null}

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
          value={overview.totals.pageViews}
        />
        <KpiCard
          icon={Users}
          label="Sessions"
          value={overview.totals.sessions}
        />
        <KpiCard
          icon={FileCheck2}
          label="Form Leads"
          value={overview.totals.leads}
        />
        <KpiCard
          icon={BarChart3}
          label="Conversion"
          value={`${overview.totals.conversionRate}%`}
        />
        <KpiCard
          icon={MousePointerClick}
          label="CTA Clicks"
          value={overview.totals.ctaClicks}
        />
      </div>

      <div className={styles.serviceGrid}>
        {overview.services.map((service) => (
          <button
            key={service.id}
            type="button"
            className={styles.serviceCard}
            onClick={() => pushParams({ service: service.id })}
          >
            <div className={styles.serviceHead}>
              <div>
                <p className={styles.serviceTitle}>{service.label}</p>
                <p className={styles.servicePath}>{service.path}</p>
              </div>
              <span className={styles.convBadge}>
                {service.conversionRate}% conv
              </span>
            </div>
            <div className={styles.metricRow}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Views</span>
                <span className={styles.metricValue}>
                  {service.pageViews.toLocaleString()}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Sessions</span>
                <span className={styles.metricValue}>
                  {service.sessions.toLocaleString()}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Leads</span>
                <span className={styles.metricValue}>
                  {service.leads.toLocaleString()}
                </span>
              </div>
            </div>
            <div className={styles.ctaMini}>
              <span className={styles.ctaChip}>Call {service.callClicks}</span>
              <span className={styles.ctaChip}>
                WA {service.whatsappClicks}
              </span>
              <span className={styles.ctaChip}>Form {service.formCtas}</span>
              <span className={styles.ctaChip}>
                Start {service.formStarts}
              </span>
            </div>
            <p className={styles.metaLine}>
              Top: {service.topCountry} · {service.topCity} · {service.topDevice}
            </p>
          </button>
        ))}
      </div>

      <DashboardCard>
        <p className={styles.sectionTitle}>Service comparison</p>
        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Service / Ad</th>
                <th className={styles.num}>Views</th>
                <th className={styles.num}>Sessions</th>
                <th className={styles.num}>Leads</th>
                <th className={styles.num}>Conv %</th>
                <th className={styles.num}>Call</th>
                <th className={styles.num}>WhatsApp</th>
                <th className={styles.num}>Form CTA</th>
                <th className={styles.num}>Form start</th>
                <th className={styles.num}>Scroll</th>
                <th>Top country</th>
                <th>Top city</th>
              </tr>
            </thead>
            <tbody>
              {overview.services.map((service) => (
                <tr key={service.id}>
                  <td>
                    <button
                      type="button"
                      className={styles.rowLink}
                      onClick={() => pushParams({ service: service.id })}
                    >
                      {service.label}
                    </button>
                  </td>
                  <td className={styles.num}>{service.pageViews}</td>
                  <td className={styles.num}>{service.sessions}</td>
                  <td className={styles.num}>{service.leads}</td>
                  <td className={styles.num}>{service.conversionRate}%</td>
                  <td className={styles.num}>{service.callClicks}</td>
                  <td className={styles.num}>{service.whatsappClicks}</td>
                  <td className={styles.num}>{service.formCtas}</td>
                  <td className={styles.num}>{service.formStarts}</td>
                  <td className={styles.num}>{service.scrollEngagement}</td>
                  <td>{service.topCountry}</td>
                  <td>{service.topCity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      <div className={styles.grid2}>
        <BreakdownCard title="Countries (all ads)" icon={Globe} items={overview.countries} />
        <BreakdownCard title="Cities (all ads)" icon={MapPin} items={overview.cities} />
        <BreakdownCard title="Devices (all ads)" icon={Smartphone} items={overview.devices} />
        <BreakdownCard title="CTA mix (all ads)" icon={MousePointerClick} items={overview.ctas} />
      </div>
    </div>
  );
}
