"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  EyeOff,
  FileText,
  Pencil,
  Globe,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { DashboardPageHeader } from "@/components/ui/tz-dashboard";
import { ConnectivityErrorBanner, EmptyTableState } from "@/components/system";
import type { UnifiedBlog } from "@/lib/adapters/types";
import { getProjectMeta } from "@/lib/projects/meta";
import type { ProjectConfig } from "@/lib/projects/config";
import {
  formatBlogDate,
  formatNumber,
  formatRelativeTime,
} from "@/lib/utils";
import styles from "./blogs.module.css";

type BlogsPanelProps = {
  project: ProjectConfig;
  blogs: UnifiedBlog[];
  error?: string | null;
  canCreate?: boolean;
};

type SortKey = "recent" | "views" | "alpha";
type StatusFilter = "ALL" | "PUBLISHED" | "DRAFT" | "SCHEDULED";

const STATUS_FILTERS: StatusFilter[] = ["ALL", "PUBLISHED", "DRAFT", "SCHEDULED"];

function normalizeStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "publish" || value === "published") return "PUBLISHED";
  if (value === "draft") return "DRAFT";
  if (value === "future" || value === "scheduled") return "SCHEDULED";
  return status.toUpperCase() || "UNKNOWN";
}

function statusClass(status: string) {
  switch (normalizeStatus(status)) {
    case "PUBLISHED":
      return styles.statusPublished;
    case "DRAFT":
      return styles.statusDraft;
    case "SCHEDULED":
      return styles.statusScheduled;
    default:
      return styles.statusDefault;
  }
}

function isPublished(blog: UnifiedBlog) {
  return normalizeStatus(blog.status) === "PUBLISHED";
}

function blogUrl(domain: string, slug: string) {
  return `https://${domain}/blog/${slug.replace(/^\//, "")}`;
}

function slugPath(slug: string) {
  const clean = slug.replace(/^\//, "");
  return `/blog/${clean}`;
}

function getPageItems(current: number, total: number) {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  if (current <= 3) return [1, 2, 3, "ellipsis", total] as const;
  if (current >= total - 2) return [1, "ellipsis", total - 2, total - 1, total] as const;
  return [1, "ellipsis", current, "ellipsis", total] as const;
}

function BlogStatusBadge({ status }: { status: string }) {
  return (
    <span className={`${styles.statusBadge} ${statusClass(status)}`}>
      <span className={styles.statusDot} aria-hidden />
      {normalizeStatus(status)}
    </span>
  );
}

export function BlogsPanel({
  project,
  blogs,
  error = null,
  canCreate = false,
}: BlogsPanelProps) {
  const router = useRouter();
  const meta = getProjectMeta(project.id);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [localeFilter, setLocaleFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncPending, setSyncPending] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const localeOptions = useMemo(() => {
    const values = new Set<string>();
    for (const blog of blogs) {
      if (blog.locale?.trim()) values.add(blog.locale.trim().toUpperCase());
    }
    return Array.from(values).sort();
  }, [blogs]);

  const publishedCount = blogs.filter(isPublished).length;
  const draftCount = blogs.filter((blog) => normalizeStatus(blog.status) === "DRAFT").length;
  const totalViews = blogs.reduce((sum, blog) => sum + (blog.viewCount ?? 0), 0);
  const avgViews =
    publishedCount === 0 ? 0 : Math.round(totalViews / publishedCount);
  const topViewed = blogs.reduce<UnifiedBlog | null>((best, blog) => {
    if (!isPublished(blog)) return best;
    if (!best || (blog.viewCount ?? 0) > (best.viewCount ?? 0)) return blog;
    return best;
  }, null);

  const filtered = useMemo(() => {
    const sorted = [...blogs];

    sorted.sort((a, b) => {
      if (sortKey === "views") {
        return (b.viewCount ?? 0) - (a.viewCount ?? 0);
      }
      if (sortKey === "alpha") {
        return a.title.localeCompare(b.title);
      }
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

    return sorted.filter((blog) => {
      const haystack = [blog.title, blog.slug, blog.status, blog.locale ?? ""]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const normalized = normalizeStatus(blog.status);
      const matchesStatus =
        statusFilter === "ALL" || normalized === statusFilter;
      const matchesLocale =
        localeFilter === "ALL" ||
        (blog.locale?.toUpperCase() ?? "") === localeFilter;

      return matchesQuery && matchesStatus && matchesLocale;
    });
  }, [blogs, query, statusFilter, localeFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * rowsPerPage;
  const pageBlogs = filtered.slice(pageStart, pageStart + rowsPerPage);

  const allVisibleSelected =
    pageBlogs.length > 0 && pageBlogs.every((blog) => selectedIds.has(blog.id));

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        pageBlogs.forEach((blog) => next.delete(blog.id));
      } else {
        pageBlogs.forEach((blog) => next.add(blog.id));
      }
      return next;
    });
  }

  function toggleRow(id: string) {
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
    setLocaleFilter("ALL");
    setSortKey("recent");
    setPage(1);
  }

  async function syncFeed() {
    setSyncPending(true);
    try {
      router.refresh();
    } finally {
      window.setTimeout(() => setSyncPending(false), 600);
    }
  }

  async function copySlug(slug: string) {
    await navigator.clipboard.writeText(slugPath(slug));
    setCopiedSlug(slug);
    window.setTimeout(() => setCopiedSlug(null), 1500);
  }

  const activeFilters = [
    statusFilter !== "ALL" ? `Status: ${statusFilter}` : null,
    localeFilter !== "ALL" ? `Language: ${localeFilter}` : null,
    query ? `Search: "${query}"` : null,
  ].filter(Boolean) as string[];

  return (
    <div className={styles.page}>
      <DashboardPageHeader
        eyebrow="Content"
        title="Blogs & Articles"
        description={
          canCreate
            ? `Create and manage blog posts stored in the ${project.name} database.`
            : `Read-only content feed from the ${project.name} database.`
        }
        actions={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.ghostButton}
              disabled={syncPending}
              onClick={syncFeed}
            >
              <RefreshCw size={18} aria-hidden />
              {syncPending ? "Refreshing…" : "Refresh"}
            </button>
            {canCreate ? (
              <Link
                href={`/${project.id}/blogs/create-new`}
                className={styles.primaryButton}
              >
                <Plus size={16} aria-hidden />
                Create blog
              </Link>
            ) : null}
          </div>
        }
      />

      {error ? (
        <ConnectivityErrorBanner
          title={`Could not load ${project.name} blogs`}
          message={error}
          cluster={meta.domain}
          onRetry={() => router.refresh()}
        />
      ) : null}

      <div className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className={styles.metricLabel}>Total Views</span>
            <TrendingUp size={18} color="var(--dash-secondary)" aria-hidden />
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{formatNumber(totalViews)}</span>
          </div>
          <p className={styles.metricHint}>Across {formatNumber(blogs.length)} synced posts</p>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className={styles.metricLabel}>Published Posts</span>
            <FileText size={18} color="var(--dash-primary-container)" aria-hidden />
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{formatNumber(publishedCount)}</span>
          </div>
          <p className={styles.metricHint}>
            {draftCount > 0
              ? `${formatNumber(draftCount)} drafts in pipeline`
              : "All posts are live"}
          </p>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className={styles.metricLabel}>Avg. Views / Post</span>
            <Globe size={18} color="var(--dash-tertiary)" aria-hidden />
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>{formatNumber(avgViews)}</span>
          </div>
          <p className={styles.metricHint}>Based on published articles only</p>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className={styles.metricLabel}>Top Performing</span>
            <TrendingUp size={18} color="var(--dash-primary-container)" aria-hidden />
          </div>
          <div className={styles.metricValueRow}>
            <span className={styles.metricValue}>
              {topViewed ? formatNumber(topViewed.viewCount ?? 0) : "—"}
            </span>
          </div>
          <p className={styles.metricHint}>
            {topViewed ? topViewed.title : "No published posts yet"}
          </p>
        </article>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchWrap}>
            <SearchIcon />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search article title, slug, or status..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className={styles.filters}>
            <label className={styles.filterSelect}>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as StatusFilter);
                  setPage(1);
                }}
              >
                {STATUS_FILTERS.map((status) => (
                  <option key={status} value={status}>
                    {status === "ALL" ? "Status: All" : status}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterSelect}>
              <select
                aria-label="Filter by language"
                value={localeFilter}
                onChange={(e) => {
                  setLocaleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="ALL">All Languages</option>
                {localeOptions.map((locale) => (
                  <option key={locale} value={locale}>
                    {locale}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterSelect}>
              <select
                aria-label="Sort articles"
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value as SortKey);
                  setPage(1);
                }}
              >
                <option value="recent">Sorted by: Most Recent</option>
                <option value="views">Most Views</option>
                <option value="alpha">Alphabetical</option>
              </select>
            </label>

            {activeFilters.length > 0 ? (
              <button type="button" className={styles.clearButton} onClick={clearFilters}>
                Reset all
              </button>
            ) : null}
          </div>
        </div>

        {activeFilters.length > 0 ? (
          <div className={styles.toolbarMeta}>
            <span className={styles.chipsLabel}>Active filters:</span>
            {activeFilters.map((label) => (
              <span key={label} className={styles.chip}>
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className={styles.tableCard}>
        {pageBlogs.length === 0 ? (
          <EmptyTableState
            tableLabel={activeFilters.length > 0 ? "Filtered Results: Articles" : undefined}
            entryCount={0}
            filters={activeFilters}
            title={
              blogs.length === 0
                ? "No blog posts yet"
                : "No articles match the current filters"
            }
            description={
              blogs.length === 0
                ? "Synced WordPress posts will appear here once the CMS feed is connected."
                : "Broaden your search query or reset the active filter tags to see more articles."
            }
            onResetFilters={activeFilters.length > 0 ? clearFilters : undefined}
            secondaryLabel="Open WordPress CMS"
            secondaryDisabled={false}
            onSecondaryAction={() =>
              window.open(`https://${meta.domain}/wp-admin`, "_blank", "noopener,noreferrer")
            }
          />
        ) : (
          <>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkCell}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    aria-label="Select all articles"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                  />
                </th>
                <th className={styles.articleCell}>Article & Details</th>
                <th>Slug & URL</th>
                <th>Status</th>
                <th className={styles.viewsCell}>Views</th>
                <th className={styles.actionCell}>Action</th>
              </tr>
            </thead>
            <tbody>
                {pageBlogs.map((blog) => {
                  const published = isPublished(blog);
                  const displayDate = published
                    ? formatBlogDate(blog.publishedAt ?? blog.updatedAt)
                    : `Updated ${formatRelativeTime(blog.updatedAt)}`;

                  return (
                    <tr key={blog.id}>
                      <td className={styles.checkCell}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          aria-label={`Select ${blog.title}`}
                          checked={selectedIds.has(blog.id)}
                          onChange={() => toggleRow(blog.id)}
                        />
                      </td>
                      <td className={styles.articleCell}>
                        <div className={styles.articleRow}>
                          <div
                            className={`${styles.thumb} ${
                              !published ? styles.thumbDraft : ""
                            }`}
                          >
                            <FileText size={22} aria-hidden />
                          </div>
                          <div>
                            <span className={styles.articleTitle}>{blog.title}</span>
                            <div className={styles.articleMeta}>
                              <span>{displayDate}</span>
                              {blog.locale ? (
                                <>
                                  <span>•</span>
                                  <span>{blog.locale.toUpperCase()}</span>
                                </>
                              ) : null}
                              {!published ? (
                                <>
                                  <span>•</span>
                                  <span>
                                    <Clock size={13} style={{ display: "inline" }} /> In review
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.slugPill}>
                          <span className={styles.slugText}>{slugPath(blog.slug)}</span>
                          <button
                            type="button"
                            className={styles.copyButton}
                            aria-label="Copy slug"
                            title="Copy slug"
                            onClick={() => copySlug(blog.slug)}
                          >
                            <Copy size={14} aria-hidden />
                          </button>
                        </div>
                        {copiedSlug === blog.slug ? (
                          <span className={styles.viewsHint}>Copied</span>
                        ) : null}
                      </td>
                      <td>
                        <BlogStatusBadge status={blog.status} />
                      </td>
                      <td className={styles.viewsCell}>
                        {published ? (
                          <>
                            <div className={styles.viewsValue}>
                              {formatNumber(blog.viewCount ?? 0)}
                            </div>
                            <div className={styles.viewsHint}>Lifetime views</div>
                          </>
                        ) : (
                          <>
                            <div className={`${styles.viewsValue} ${styles.viewsMuted}`}>—</div>
                            <div className={styles.viewsHint}>Not yet live</div>
                          </>
                        )}
                      </td>
                      <td className={styles.actionCell}>
                        <div className={styles.actionButtons}>
                          {canCreate ? (
                            <Link
                              className={styles.editLink}
                              href={`/${project.id}/blogs/edit/${blog.id}`}
                              title="Edit article"
                            >
                              <Pencil size={16} aria-hidden />
                            </Link>
                          ) : null}
                          {published ? (
                            <a
                              className={styles.viewLink}
                              href={blogUrl(meta.domain, blog.slug)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View published article"
                            >
                              <ExternalLink size={16} aria-hidden />
                            </a>
                          ) : (
                            <span className={styles.viewDisabled} title="Draft preview unavailable">
                              <EyeOff size={16} aria-hidden />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <div className={styles.paginationMeta}>
            <span>
              Showing {filtered.length === 0 ? 0 : pageStart + 1}-
              {Math.min(pageStart + rowsPerPage, filtered.length)} of{" "}
              {formatNumber(filtered.length)} articles
            </span>
            <label>
              Per page:{" "}
              <select
                className={styles.pageSizeSelect}
                aria-label="Items per page"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
          </div>

          <div className={styles.pageButtons}>
            <button
              type="button"
              className={styles.pageButton}
              disabled={currentPage <= 1}
              aria-label="Previous page"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            {getPageItems(currentPage, totalPages).map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className={styles.pageNumber}>
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`${styles.pageNumber} ${
                    item === currentPage ? styles.pageNumberActive : ""
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
              aria-label="Next page"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        </div>
          </>
        )}
      </div>

    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className={styles.searchIcon}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
