"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bot,
  FileText,
  Inbox,
  Mail,
  RefreshCw,
  Truck,
  Users,
} from "lucide-react";
import type { UnifiedLead } from "@/lib/adapters/types";
import type { OverviewMetrics } from "@/lib/adapters/types";
import { getProjectMeta } from "@/lib/projects/meta";
import type { ProjectConfig } from "@/lib/projects/config";
import { DashboardPageHeader } from "@/components/ui/tz-dashboard";
import { ConnectivityErrorBanner } from "@/components/system";
import {
  formatNumber,
  formatRelativeTime,
  getInitials,
} from "@/lib/utils";
import styles from "./overview.module.css";

export type QuickModule = {
  id: string;
  href: string;
  title: string;
  description: string;
  icon: "analytics" | "leads" | "chatbot" | "blogs";
  badge?: string;
  hint?: string;
};

type OverviewPanelProps = {
  project: ProjectConfig;
  metrics: OverviewMetrics;
  recentLeads: UnifiedLead[];
  error: string | null;
  quickModules: QuickModule[];
};

function statusClass(status: string) {
  switch (status.toUpperCase()) {
    case "NEW":
      return styles.statusNew;
    case "CONTACTED":
      return styles.statusContacted;
    case "QUALIFIED":
      return styles.statusQualified;
    default:
      return styles.statusDefault;
  }
}

function avatarStyle(index: number) {
  if (index === 0) return styles.statusNew;
  if (index === 1) return styles.statusContacted;
  return styles.statusQualified;
}

export function OverviewPanel({
  project,
  metrics,
  recentLeads,
  error,
  quickModules,
}: OverviewPanelProps) {
  const router = useRouter();
  const meta = getProjectMeta(project.id);
  const [refreshing, setRefreshing] = useState(false);
  const [showError, setShowError] = useState(Boolean(error));

  async function refreshData() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 900);
  }

  const kpis = [
    {
      label: "Total Leads",
      value: formatNumber(metrics.totalLeads),
      icon: Inbox,
    },
    {
      label: "New Leads (30d)",
      value: formatNumber(metrics.newLeads30d),
      icon: Mail,
    },
    {
      label: "Visitors (30d)",
      value: formatNumber(metrics.visitors30d),
      icon: Users,
    },
    {
      label: "Conversion Rate",
      value: `${metrics.conversionRate30d}%`,
      icon: BarChart3,
      accent: "secondary" as const,
    },
  ];

  return (
    <div className={styles.page}>
      <DashboardPageHeader
        eyebrow="Dashboard Overview"
        title={`Welcome to ${project.name}`}
        description={`Performance snapshot and quick operations for ${meta.domain}.`}
        actions={
          <button
            type="button"
            className={styles.refreshButton}
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw
              size={18}
              className={refreshing ? styles.refreshIconSpin : undefined}
              aria-hidden
            />
            Refresh data
          </button>
        }
      />

      {showError && error ? (
        <ConnectivityErrorBanner
          title={`Could not connect to ${project.name} database`}
          message={error}
          cluster={meta.domain}
          port="5432"
          onRetry={() => router.refresh()}
          onDismiss={() => setShowError(false)}
        />
      ) : null}

      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article key={kpi.label} className={styles.kpiCard}>
              <div>
                <div className={styles.kpiTop}>
                  <span className={styles.kpiLabel}>{kpi.label}</span>
                  <Icon size={20} color="var(--dash-outline)" aria-hidden />
                </div>
                <div className={styles.kpiValue}>{kpi.value}</div>
              </div>
              <div
                className={`${styles.kpiAccent} ${
                  kpi.accent === "secondary" ? styles.kpiAccentSecondary : ""
                }`}
                aria-hidden
              />
            </article>
          );
        })}
      </div>

      {(metrics.blogCount !== undefined || metrics.userCount !== undefined) && (
        <div className={styles.secondaryGrid}>
          {metrics.blogCount !== undefined ? (
            <article className={styles.infoCard}>
              <div className={styles.infoCardBody}>
                <div className={styles.infoIcon}>
                  <FileText size={24} aria-hidden />
                </div>
                <div>
                  <div className={styles.infoLabel}>Editorial Content</div>
                  <div className={styles.infoTitle}>
                    {formatNumber(metrics.blogCount)} Published Posts
                  </div>
                  <div className={styles.infoHint}>Read-only sync from project CMS</div>
                </div>
              </div>
            </article>
          ) : null}

          {metrics.userCount !== undefined ? (
            <article className={styles.infoCard}>
              <div className={styles.infoCardBody}>
                <div className={`${styles.infoIcon} ${styles.infoIconTertiary}`}>
                  <BadgeCheck size={24} aria-hidden />
                </div>
                <div>
                  <div className={styles.infoLabel}>Access Control</div>
                  <div className={styles.infoTitle}>
                    {formatNumber(metrics.userCount)} Team Members
                  </div>
                  <div className={styles.infoHint}>Assigned roles in project database</div>
                </div>
              </div>
              <span className={styles.infoBadge}>RBAC Active</span>
            </article>
          ) : null}
        </div>
      )}

      <div className={styles.splitGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Quick Actions & Modules</h2>
              <p className={styles.panelSubtitle}>
                High-frequency workflows for {project.name} operations
              </p>
            </div>
          </div>

          <div className={styles.moduleGrid}>
            {quickModules.map((module) => (
              <Link key={module.id} href={module.href} className={styles.moduleLink}>
                <div className={styles.moduleTop}>
                  <div
                    className={`${styles.moduleIcon} ${
                      module.icon === "chatbot" ? styles.moduleIconSecondary : ""
                    }`}
                  >
                    {module.icon === "analytics" ? (
                      <BarChart3 size={20} aria-hidden />
                    ) : null}
                    {module.icon === "leads" ? <Inbox size={20} aria-hidden /> : null}
                    {module.icon === "chatbot" ? <Bot size={20} aria-hidden /> : null}
                    {module.icon === "blogs" ? <FileText size={20} aria-hidden /> : null}
                  </div>
                  {module.badge ? (
                    <span className={styles.moduleBadge}>{module.badge}</span>
                  ) : null}
                  {module.hint ? (
                    <span className={styles.moduleHint}>{module.hint}</span>
                  ) : null}
                  {!module.badge && !module.hint && module.icon !== "chatbot" ? (
                    <ArrowUpRight size={18} color="var(--dash-outline)" aria-hidden />
                  ) : null}
                </div>
                <div>
                  <div className={styles.moduleTitle}>{module.title}</div>
                  <p className={styles.moduleDescription}>{module.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className={styles.telemetryLine}>
            <div className={styles.telemetryLeft}>
              <Truck size={20} color="var(--dash-secondary)" aria-hidden />
              <span>
                Active leads pipeline:{" "}
                <strong>{formatNumber(metrics.newLeads30d)}</strong> new in the last
                30 days
              </span>
            </div>
            <span className={styles.telemetryLabel}>Live data</span>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.inquiryHeader}>
            <div>
              <h2 className={styles.panelTitle}>Recent Inquiries (30 days)</h2>
              <p className={styles.panelSubtitle}>
                Latest submissions from the last 30 days
              </p>
            </div>
          </div>

          {recentLeads.length === 0 ? (
            <div className={styles.emptyInquiries}>
              No inquiries in the last 30 days
            </div>
          ) : (
            <div className={styles.inquiryList}>
              {recentLeads.map((lead, index) => (
                <Link
                  key={lead.id}
                  href={`/${project.slug}/leads/${lead.id}`}
                  className={styles.inquiryItem}
                >
                  <div className={styles.inquiryLeft}>
                    <span
                      className={`${styles.inquiryAvatar} ${avatarStyle(index)}`}
                    >
                      {getInitials(lead.fullName || lead.email || "?")}
                    </span>
                    <div>
                      <div className={styles.inquiryName}>
                        {lead.fullName || "Unknown contact"}
                      </div>
                      <div className={styles.inquiryService}>
                        {lead.service || lead.formKey || lead.source || "General inquiry"}
                      </div>
                    </div>
                  </div>
                  <div className={styles.inquiryRight}>
                    <span
                      className={`${styles.statusBadge} ${statusClass(lead.status)}`}
                    >
                      {lead.status}
                    </span>
                    <span className={styles.inquiryTime}>
                      {formatRelativeTime(lead.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className={styles.inquiryFooter}>
            <Link href={`/${project.slug}/leads`} className={styles.viewAllLink}>
              View all {formatNumber(metrics.totalLeads)} leads
              <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
