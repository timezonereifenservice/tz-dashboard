"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RotateCcw, Search } from "lucide-react";
import { ConnectivityErrorBanner, EmptyTableState } from "@/components/system";
import { DashboardPageHeader } from "@/components/ui/tz-dashboard";
import {
  MARKETING_SITE,
  marketingCountryLabel,
  marketingPageLabel,
  marketingServiceLabel,
} from "@/lib/marketing/constants";
import type { MarketingLead } from "@/lib/marketing/types";
import type { ProjectConfig } from "@/lib/projects/config";
import { formatDate, formatNumber } from "@/lib/utils";
import styles from "@/components/leads/leads.module.css";

type MarketingLeadsPanelProps = {
  project: ProjectConfig;
  leads: MarketingLead[];
  error: string | null;
};

function displayName(lead: MarketingLead) {
  if (lead.name.trim()) return lead.name.trim();
  const parts = [lead.firstName, lead.lastName].map((p) => p.trim()).filter(Boolean);
  return parts.join(" ") || "Unknown contact";
}

function exportCsv(leads: MarketingLead[]) {
  const rows = [
    [
      "Created",
      "Name",
      "Email",
      "Phone",
      "Service",
      "Page",
      "Brand",
      "Model",
      "Year",
      "Country",
      "City",
      "Device",
      "Browser",
      "UTM Source",
      "UTM Medium",
      "UTM Campaign",
    ],
    ...leads.map((lead) => [
      lead.createdAt,
      displayName(lead),
      lead.email,
      lead.phone,
      lead.serviceLabel || marketingServiceLabel(lead.service),
      marketingPageLabel(lead.page),
      lead.brand,
      lead.model,
      lead.year,
      lead.country,
      lead.city,
      lead.device,
      lead.browser,
      lead.utmSource,
      lead.utmMedium,
      lead.utmCampaign,
    ]),
  ];
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "marketing-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function MarketingLeadsPanel({
  project,
  leads,
  error,
}: MarketingLeadsPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((lead) => {
      const haystack = [
        displayName(lead),
        lead.email,
        lead.phone,
        lead.service,
        lead.serviceLabel,
        lead.page,
        lead.brand,
        lead.model,
        lead.vehicle,
        lead.country,
        lead.city,
        lead.device,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [leads, query]);

  return (
    <div className={styles.page}>
      <DashboardPageHeader
        eyebrow="Marketing Pages"
        title="Landing Page Leads"
        description={`Form submissions captured on ${MARKETING_SITE.domain}.`}
        actions={
          <div className={styles.headerActions}>
            <span className={styles.totalBadge}>{formatNumber(leads.length)} Total</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => exportCsv(filtered)}
            >
              <Download size={18} aria-hidden />
              Export CSV
            </button>
          </div>
        }
      />

      {error ? (
        <ConnectivityErrorBanner
          title="Could not load marketing leads"
          message={error}
          cluster={MARKETING_SITE.domain}
          port="6543"
          onRetry={() => router.refresh()}
        />
      ) : null}

      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={20} aria-hidden />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search name, email, phone, city, service, or page…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {query ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => setQuery("")}
            >
              <RotateCcw size={18} aria-hidden />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <EmptyTableState
            entryCount={0}
            title={leads.length === 0 ? "No marketing leads yet" : "No leads match your search"}
            description={
              leads.length === 0
                ? "Submissions from landing page forms will appear here automatically."
                : "Try a different search term."
            }
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.tableHead}>
                <tr>
                  <th>Contact</th>
                  <th>Service</th>
                  <th>Landing Page</th>
                  <th>Location</th>
                  <th>Device</th>
                  <th>Vehicle</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`${styles.tableRow} ${
                      index % 2 === 1 ? styles.tableRowAlt : ""
                    }`}
                  >
                    <td>
                      <Link
                        href={`/${project.slug}/marketing-leads/${lead.id}`}
                        className={styles.contactName}
                      >
                        {displayName(lead)}
                      </Link>
                      <div className={styles.contactEmail}>{lead.email || "—"}</div>
                      {lead.phone ? (
                        <div className={styles.contactHint}>{lead.phone}</div>
                      ) : null}
                    </td>
                    <td>
                      {lead.serviceLabel || marketingServiceLabel(lead.service) || "—"}
                    </td>
                    <td>{marketingPageLabel(lead.page)}</td>
                    <td>
                      {[
                        lead.city || null,
                        lead.country
                          ? marketingCountryLabel(lead.country)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td>{lead.device || "—"}</td>
                    <td>
                      {[lead.brand, lead.model, lead.year].filter(Boolean).join(" ") ||
                        lead.vehicle ||
                        "—"}
                    </td>
                    <td>{formatDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
