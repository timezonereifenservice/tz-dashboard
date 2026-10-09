"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardCard, DashboardPageHeader } from "@/components/ui/tz-dashboard";
import {
  MARKETING_SITE,
  marketingCountryLabel,
  marketingEventLabel,
  marketingPageLabel,
  marketingServiceLabel,
} from "@/lib/marketing/constants";
import type { MarketingLeadDetail } from "@/lib/marketing/types";
import type { ProjectConfig } from "@/lib/projects/config";
import { formatDate } from "@/lib/utils";
import styles from "./marketing-lead-detail.module.css";

type Props = {
  project: ProjectConfig;
  detail: MarketingLeadDetail;
};

function displayName(detail: MarketingLeadDetail) {
  const lead = detail.lead;
  if (lead.name.trim()) return lead.name.trim();
  return (
    [lead.firstName, lead.lastName].map((p) => p.trim()).filter(Boolean).join(" ") ||
    "Unknown contact"
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <dt className={styles.fieldLabel}>{label}</dt>
      <dd className={styles.fieldValue}>{value.trim() || "—"}</dd>
    </div>
  );
}

export function MarketingLeadDetailPanel({ project, detail }: Props) {
  const { lead, timeline } = detail;
  const backHref = `/${project.slug}/marketing-leads`;

  return (
    <div className={styles.page}>
      <DashboardPageHeader
        eyebrow="Marketing Pages"
        title={displayName(detail)}
        description={`Form submission from ${MARKETING_SITE.domain}`}
        actions={
          <Link href={backHref} className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden />
            Back to leads
          </Link>
        }
      />

      <div className={styles.grid}>
        <DashboardCard>
          <p className={styles.sectionTitle}>Contact</p>
          <dl className={styles.fieldGrid}>
            <Field label="Name" value={displayName(detail)} />
            <Field label="Email" value={lead.email} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Created" value={formatDate(lead.createdAt)} />
            <Field
              label="Email status"
              value={
                lead.emailSent
                  ? "Sent"
                  : lead.emailError
                    ? `Failed: ${lead.emailError}`
                    : "Pending / unknown"
              }
            />
          </dl>
        </DashboardCard>

        <DashboardCard>
          <p className={styles.sectionTitle}>Offer & page</p>
          <dl className={styles.fieldGrid}>
            <Field
              label="Service"
              value={lead.serviceLabel || marketingServiceLabel(lead.service)}
            />
            <Field label="Landing page" value={marketingPageLabel(lead.page)} />
            <Field label="Locale" value={lead.locale || "—"} />
            <Field label="Session" value={lead.sessionId || "—"} />
          </dl>
        </DashboardCard>

        <DashboardCard>
          <p className={styles.sectionTitle}>Vehicle</p>
          <dl className={styles.fieldGrid}>
            <Field label="Brand" value={lead.brand} />
            <Field label="Model" value={lead.model} />
            <Field label="Year" value={lead.year} />
            <Field label="Vehicle" value={lead.vehicle} />
            <Field label="HSN" value={lead.hsn} />
            <Field label="TSN" value={lead.tsn} />
            <Field label="VIN" value={lead.vin} />
            <Field label="Mileage" value={lead.mileage} />
            <Field label="Tire size" value={lead.tireSize} />
            <Field label="Preferred date" value={lead.preferredDate} />
          </dl>
        </DashboardCard>

        <DashboardCard>
          <p className={styles.sectionTitle}>Location & device</p>
          <dl className={styles.fieldGrid}>
            <Field
              label="Country"
              value={lead.country ? marketingCountryLabel(lead.country) : ""}
            />
            <Field label="City" value={lead.city} />
            <Field label="Region" value={lead.region} />
            <Field label="Device" value={lead.device} />
            <Field label="Browser" value={lead.browser} />
            <Field label="OS" value={lead.os} />
          </dl>
        </DashboardCard>

        <DashboardCard>
          <p className={styles.sectionTitle}>Attribution</p>
          <dl className={styles.fieldGrid}>
            <Field label="Referrer" value={lead.referrer} />
            <Field label="UTM source" value={lead.utmSource} />
            <Field label="UTM medium" value={lead.utmMedium} />
            <Field label="UTM campaign" value={lead.utmCampaign} />
          </dl>
        </DashboardCard>

        <DashboardCard className={styles.fullWidth}>
          <p className={styles.sectionTitle}>Session timeline</p>
          {timeline.length === 0 ? (
            <p className={styles.emptyHint}>
              No related analytics events for this session.
            </p>
          ) : (
            <ol className={styles.timeline}>
              {timeline.map((event) => (
                <li key={event.id} className={styles.timelineItem}>
                  <div className={styles.timelineTime}>
                    {formatDate(event.createdAt)}
                  </div>
                  <div className={styles.timelineBody}>
                    <strong>{marketingEventLabel(event.event)}</strong>
                    {event.placement ? (
                      <span className={styles.timelineMeta}>
                        {" "}
                        · {event.placement}
                      </span>
                    ) : null}
                    <div className={styles.timelineMeta}>
                      {[
                        event.page ? marketingPageLabel(event.page) : null,
                        event.city || null,
                        event.country
                          ? marketingCountryLabel(event.country)
                          : null,
                        event.device || null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </DashboardCard>
      </div>
    </div>
  );
}
