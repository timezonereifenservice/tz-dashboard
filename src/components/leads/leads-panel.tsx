"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Archive,
  ChevronLeft,
  ChevronRight,
  Download,
  MailOpen,
  RotateCcw,
  Search,
  Timer,
  TrendingUp,
  Truck,
  UserCheck,
  Verified,
} from "lucide-react";
import {
  LeadsStatusBadge,
  STATUS_OPTIONS,
  serviceIcon,
  sourceLabel,
} from "@/components/leads/lead-shared";
import { DashboardPageHeader } from "@/components/ui/tz-dashboard";
import { ConnectivityErrorBanner, EmptyTableState } from "@/components/system";
import { getProjectMeta } from "@/lib/projects/meta";
import type { ProjectConfig } from "@/lib/projects/config";
import {
  formatLeadCreated,
  formatNumber,
  formatPct,
} from "@/lib/utils";
import type { UnifiedLead } from "@/lib/adapters/types";
import styles from "./leads.module.css";

const QUALIFIED_STATUSES = new Set([
  "QUALIFIED",
  "QUOTED",
  "NEGOTIATION",
  "CONFIRMED",
  "WON",
]);

type LeadsTableProps = {
  project: ProjectConfig;
  title: string;
  description?: string;
  leads: UnifiedLead[];
  error?: string | null;
};

function isWithinDays(value: string, days: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() <= days * 86_400_000;
}

function isToday(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
}

function exportLeadsCsv(projectName: string, leads: UnifiedLead[]) {
  const rows = [
    ["Name", "Email", "Phone", "Service", "Source", "Status", "Created"],
    ...leads.map((lead) => [
      lead.fullName,
      lead.email,
      lead.phone,
      lead.service,
      sourceLabel(lead),
      lead.status,
      lead.createdAt,
    ]),
  ];
  const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName.toLowerCase().replace(/\s+/g, "-")}-leads.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function getPageItems(current: number, total: number) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  if (current <= 3) return [1, 2, 3, "ellipsis", total] as const;
  if (current >= total - 2) return [1, "ellipsis", total - 2, total - 1, total] as const;
  return [1, "ellipsis", current, "ellipsis", total] as const;
}

export function LeadsTable({
  project,
  title,
  description,
  leads,
  error = null,
}: LeadsTableProps) {
  const router = useRouter();
  const meta = getProjectMeta(project.id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "7d" | "30d">("30d");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const serviceOptions = useMemo(() => {
    const values = new Set<string>();
    for (const lead of leads) {
      if (lead.service.trim()) values.add(lead.service.trim());
    }
    return Array.from(values).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const haystack = [
        lead.fullName,
        lead.email,
        lead.phone,
        lead.service,
        lead.message,
        lead.formKey,
        lead.source,
        lead.sourcePage,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
      const matchesService =
        serviceFilter === "ALL" || lead.service.trim() === serviceFilter;
      const matchesDate =
        dateFilter === "ALL" ||
        (dateFilter === "7d" ? isWithinDays(lead.createdAt, 7) : isWithinDays(lead.createdAt, 30));

      return matchesQuery && matchesStatus && matchesService && matchesDate;
    });
  }, [leads, query, statusFilter, serviceFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageLeads = filtered.slice(pageStart, pageStart + rowsPerPage);

  const newTodayCount = leads.filter(
    (lead) => lead.status === "NEW" && isToday(lead.createdAt),
  ).length;
  const qualificationRate =
    leads.length === 0
      ? 0
      : (leads.filter((lead) => QUALIFIED_STATUSES.has(lead.status)).length / leads.length) * 100;
  const coldShare =
    leads.length === 0
      ? 0
      : (leads.filter((lead) =>
          /kühl|cold|frigo|refrig|pharma/i.test(`${lead.service} ${lead.message}`),
        ).length /
          leads.length) *
        100;
  const recentCount = leads.filter((lead) => isWithinDays(lead.createdAt, 30)).length;

  const activeFilterLabels = useMemo(() => {
    return [
      statusFilter !== "ALL" ? `Status: ${statusFilter}` : null,
      serviceFilter !== "ALL" ? `Service: ${serviceFilter}` : null,
      dateFilter === "7d" ? "Range: Last 7 Days" : dateFilter === "30d" ? "Range: Last 30 Days" : null,
      query ? `Search: "${query}"` : null,
    ].filter(Boolean) as string[];
  }, [statusFilter, serviceFilter, dateFilter, query]);

  const allVisibleSelected =
    pageLeads.length > 0 && pageLeads.every((lead) => selectedIds.has(lead.id));

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        pageLeads.forEach((lead) => next.delete(lead.id));
      } else {
        pageLeads.forEach((lead) => next.add(lead.id));
      }
      return next;
    });
  }

  function toggleLead(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setServiceFilter("ALL");
    setDateFilter("ALL");
    setPage(1);
  }

  const pageItems = getPageItems(currentPage, totalPages);

  return (
    <div className={styles.page}>
      <DashboardPageHeader
        eyebrow="Lead Management"
        title={title}
        description={
          description ??
          "Real-time pipeline across active inquiry channels, cold-chain quotes, and freight requests."
        }
        actions={
          <div className={styles.headerActions}>
            <span className={styles.totalBadge}>{formatNumber(leads.length)} Total</span>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => exportLeadsCsv(project.name, filtered)}
            >
              <Download size={18} aria-hidden />
              Export CSV
            </button>
          </div>
        }
      />

      {error ? (
        <ConnectivityErrorBanner
          title={`Could not connect to ${project.name} database`}
          message={error}
          cluster={meta.domain}
          port="5432"
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
              placeholder="Search name, email, phone, service, or form..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className={styles.filters}>
            <label className={styles.filterSelect}>
              <span className={styles.filterLabel}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterSelect}>
              <span className={styles.filterLabel}>Service:</span>
              <select
                value={serviceFilter}
                onChange={(e) => {
                  setServiceFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Services</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterSelect}>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as "ALL" | "7d" | "30d");
                  setPage(1);
                }}
              >
                <option value="30d">Last 30 days</option>
                <option value="7d">Last 7 days</option>
                <option value="ALL">All time</option>
              </select>
            </label>

            <button type="button" className={styles.clearButton} onClick={clearFilters}>
              <RotateCcw size={18} aria-hidden />
              Clear
            </button>
          </div>
        </div>

        <div className={styles.toolbarMeta}>
          <div className={styles.chips}>
            <span className={styles.chipsLabel}>Active:</span>
            <span className={styles.chip}>Property: {project.name}</span>
            <span className={styles.chip}>
              Window: {dateFilter === "ALL" ? "All time" : dateFilter === "7d" ? "7 days" : "30 days"}
            </span>
          </div>
          <div className={styles.countMeta}>
            Showing <strong>{formatNumber(filtered.length)}</strong> of{" "}
            <strong>{formatNumber(leads.length)}</strong> leads
          </div>
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div className={styles.bulkBar}>
          <div className={styles.opsText}>
            <strong>{selectedIds.size}</strong> inquiries selected
          </div>
          <div className={styles.bulkActions}>
            <button type="button" className={styles.bulkButton} disabled title="Coming soon">
              <MailOpen size={16} aria-hidden />
              Mark Read
            </button>
            <button type="button" className={styles.bulkButton} disabled title="Coming soon">
              <UserCheck size={16} aria-hidden />
              Assign Dispatcher
            </button>
            <button type="button" className={styles.bulkButton} disabled title="Coming soon">
              <Archive size={16} aria-hidden />
              Archive
            </button>
          </div>
        </div>
      ) : null}

      <div className={styles.tableCard}>
        {pageLeads.length === 0 ? (
          <EmptyTableState
            tableLabel={activeFilterLabels.length > 0 ? "Filtered Results: Leads" : undefined}
            entryCount={0}
            filters={activeFilterLabels}
            title={
              leads.length === 0
                ? "No leads yet"
                : "No leads found matching your criteria"
            }
            description={
              leads.length === 0 ? (
                "Inbound inquiries will appear here once forms and API feeds start syncing."
              ) : (
                <>
                  We couldn&apos;t find any leads matching your current filters.
                  {statusFilter !== "ALL" ? (
                    <>
                      {" "}
                      Try removing <strong>Status: {statusFilter}</strong> or broadening the
                      date window.
                    </>
                  ) : (
                    " Broaden your query timeframe or reset parameter tags."
                  )}
                </>
              )
            }
            onResetFilters={activeFilterLabels.length > 0 ? clearFilters : undefined}
          />
        ) : (
          <>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeadCenter}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={allVisibleSelected}
                    aria-label="Select all visible leads"
                    onChange={toggleAllVisible}
                  />
                </th>
                <th>Contact</th>
                <th>Service & Route</th>
                <th>Source</th>
                <th>Status</th>
                <th>Created</th>
                <th className={styles.tableHeadRight}>Action</th>
              </tr>
            </thead>
            <tbody>
                {pageLeads.map((lead, index) => {
                  const created = formatLeadCreated(lead.createdAt);
                  const isNew = lead.status === "NEW";
                  return (
                    <tr
                      key={lead.id}
                      className={`${styles.tableRow} ${
                        index % 2 === 1 ? styles.tableRowAlt : ""
                      }`}
                    >
                      <td className={styles.tableHeadCenter}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={selectedIds.has(lead.id)}
                          aria-label={`Select ${lead.fullName || lead.email}`}
                          onChange={() => toggleLead(lead.id)}
                        />
                      </td>
                      <td>
                        <div className={styles.contactNameRow}>
                          <span className={styles.contactName}>
                            {lead.fullName || "Unknown contact"}
                          </span>
                          {isNew ? <span className={styles.newDot} aria-hidden /> : null}
                        </div>
                        <div className={styles.contactEmail}>{lead.email || "—"}</div>
                        {lead.phone ? (
                          <div className={styles.contactHint}>{lead.phone}</div>
                        ) : null}
                      </td>
                      <td>
                        <div className={styles.serviceTitle}>
                          {serviceIcon(lead.service)}
                          <span>{lead.service || "General inquiry"}</span>
                        </div>
                        {lead.sourcePage ? (
                          <div className={styles.serviceRoute}>
                            <span>{lead.sourcePage}</span>
                          </div>
                        ) : null}
                        {lead.message ? (
                          <div className={styles.serviceMeta}>
                            {lead.message.slice(0, 72)}
                            {lead.message.length > 72 ? "…" : ""}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <span className={styles.sourceBadge}>{sourceLabel(lead)}</span>
                      </td>
                      <td>
                        <LeadsStatusBadge status={lead.status} />
                      </td>
                      <td>
                        <div className={styles.createdPrimary}>{created.primary}</div>
                        <div className={styles.createdSecondary}>{created.secondary}</div>
                      </td>
                      <td className={styles.tableHeadRight}>
                        <Link
                          href={`/${project.slug}/leads/${lead.id}`}
                          className={styles.viewButton}
                        >
                          View
                          <ArrowRight size={16} aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <div className={styles.footerLeft}>
            <span>
              Showing{" "}
              <strong>
                {filtered.length === 0 ? 0 : pageStart + 1}-
                {Math.min(pageStart + rowsPerPage, filtered.length)}
              </strong>{" "}
              of <strong>{formatNumber(filtered.length)}</strong> inquiries
            </span>
            <label className={styles.rowsSelect}>
              Rows:
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageButton}
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft size={16} aria-hidden />
              Previous
            </button>
            {pageItems.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className={styles.pageEllipsis}>
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`${styles.pageButton} ${
                    item === currentPage ? styles.pageButtonActive : ""
                  }`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              className={styles.pageButton}
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
              <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>
          </>
        )}
      </div>

      <div className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.metricIconPrimary}`}>
            <Timer size={22} aria-hidden />
          </div>
          <div>
            <div className={styles.metricValue}>{formatNumber(newTodayCount)}</div>
            <div className={styles.metricLabel}>New Today</div>
          </div>
        </article>
        <article className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.metricIconSecondary}`}>
            <Verified size={22} aria-hidden />
          </div>
          <div>
            <div className={styles.metricValue}>{formatPct(Number(qualificationRate.toFixed(1)))}</div>
            <div className={styles.metricLabel}>Qualification Rate</div>
          </div>
        </article>
        <article className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.metricIconSky}`}>
            <Truck size={22} aria-hidden />
          </div>
          <div>
            <div className={styles.metricValue}>{formatPct(Number(coldShare.toFixed(1)))}</div>
            <div className={styles.metricLabel}>Cold-chain Share</div>
          </div>
        </article>
        <article className={styles.metricCard}>
          <div className={`${styles.metricIcon} ${styles.metricIconTeal}`}>
            <TrendingUp size={22} aria-hidden />
          </div>
          <div>
            <div className={styles.metricValue}>{formatNumber(recentCount)}</div>
            <div className={styles.metricLabel}>Inquiries (30d)</div>
          </div>
        </article>
      </div>
    </div>
  );
}
