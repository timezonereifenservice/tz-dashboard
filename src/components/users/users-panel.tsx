"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { CreateUserModal } from "@/components/users/create-user-modal";
import { UserAvatar } from "@/components/users/user-avatar";
import {
  ConnectivityErrorBanner,
  EmptyTableState,
  ToastNotification,
} from "@/components/system";
import type { UserType } from "@/lib/projects/access";
import type { HubUser } from "@/lib/users/types";
import { formatBlogDate, formatNumber, formatRelativeTime } from "@/lib/utils";
import styles from "./users.module.css";

type UsersPanelProps = {
  users: HubUser[];
  currentUserId: string;
  canManageUsers?: boolean;
  error?: string | null;
};

function roleBadgeClass(userType: UserType) {
  switch (userType) {
    case "ADMIN":
      return styles.roleAdmin;
    case "EDITOR":
      return styles.roleEditor;
    default:
      return styles.roleViewer;
  }
}

function roleLabel(userType: UserType) {
  switch (userType) {
    case "ADMIN":
      return "Admin";
    case "EDITOR":
      return "Editor";
    default:
      return "Viewer";
  }
}

export function UsersPanel({
  users,
  currentUserId,
  canManageUsers = true,
  error = null,
}: UsersPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserType>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [refreshPending, setRefreshPending] = useState(false);
  const [toast, setToast] = useState<{
    variant: "success" | "error";
    title: string;
    meta?: string;
  } | null>(null);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery =
        !query || user.email.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "ALL" || user.userType === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? user.isActive : !user.isActive);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((user) => user.isActive).length,
      admins: users.filter((user) => user.userType === "ADMIN").length,
      inactive: users.filter((user) => !user.isActive).length,
    };
  }, [users]);

  const activeFilters = useMemo(() => {
    return [
      roleFilter !== "ALL" ? `Role: ${roleFilter}` : null,
      statusFilter !== "ALL" ? `Status: ${statusFilter}` : null,
      query ? `Search: "${query}"` : null,
    ].filter(Boolean) as string[];
  }, [roleFilter, statusFilter, query]);

  async function handleRefresh() {
    setRefreshPending(true);
    try {
      router.refresh();
    } finally {
      window.setTimeout(() => setRefreshPending(false), 600);
    }
  }

  function clearFilters() {
    setQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  }

  async function handleCreateUser(input: {
    email: string;
    password: string;
    userType: UserType;
    isActive: boolean;
  }) {
    setPending(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to create user.");
      }

      setModalOpen(false);
      setToast({
        variant: "success",
        title: "User created",
        meta: `${input.email} can now sign in to ConsoleHub.`,
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.page}>
      {toast ? (
        <ToastNotification
          variant={toast.variant}
          title={toast.title}
          meta={toast.meta}
        />
      ) : null}

      <div className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Users</h1>
          </div>
          <p className={styles.description}>
            Manage dashboard accounts, roles, and sidebar access for your team.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.ghostButton}
            disabled={refreshPending}
            onClick={handleRefresh}
          >
            <RefreshCw size={18} aria-hidden />
            {refreshPending ? "Refreshing…" : "Refresh"}
          </button>
          {canManageUsers ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setModalOpen(true)}
            >
              <Plus size={16} aria-hidden />
              Create user
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <ConnectivityErrorBanner
          title="Could not load dashboard users"
          message={error}
          onRetry={() => router.refresh()}
        />
      ) : null}

      <div className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className={styles.metricLabel}>Total Users</span>
            <Users size={18} color="var(--dash-primary-container)" aria-hidden />
          </div>
          <div className={styles.metricValue}>{formatNumber(stats.total)}</div>
          <p className={styles.metricHint}>All dashboard accounts</p>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className={styles.metricLabel}>Active</span>
            <UserCheck size={18} color="var(--dash-secondary)" aria-hidden />
          </div>
          <div className={styles.metricValue}>{formatNumber(stats.active)}</div>
          <p className={styles.metricHint}>Can sign in now</p>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className={styles.metricLabel}>Admins</span>
            <Shield size={18} color="var(--dash-primary-container)" aria-hidden />
          </div>
          <div className={styles.metricValue}>{formatNumber(stats.admins)}</div>
          <p className={styles.metricHint}>Full management access</p>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricHead}>
            <span className={styles.metricLabel}>Inactive</span>
            <UserX size={18} color="var(--dash-outline)" aria-hidden />
          </div>
          <div className={styles.metricValue}>{formatNumber(stats.inactive)}</div>
          <p className={styles.metricHint}>Sign-in disabled</p>
        </article>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          <div className={styles.searchWrap}>
            <Search size={20} className={styles.searchIcon} aria-hidden />
            <input
              type="search"
              value={query}
              placeholder="Search by email…"
              className={styles.searchInput}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className={styles.filters}>
            <label className={styles.filterSelect}>
              <select
                value={roleFilter}
                aria-label="Filter by role"
                onChange={(event) =>
                  setRoleFilter(event.target.value as "ALL" | UserType)
                }
              >
                <option value="ALL">All roles</option>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </label>
            <label className={styles.filterSelect}>
              <select
                value={statusFilter}
                aria-label="Filter by status"
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "ALL" | "ACTIVE" | "INACTIVE",
                  )
                }
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
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
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyTableState
                      variant="embedded"
                      title={users.length === 0 ? "No users yet" : "No matches"}
                      description={
                        users.length === 0
                          ? "Create the first dashboard user to grant ConsoleHub access."
                          : "Try adjusting your search or filters."
                      }
                      onResetFilters={activeFilters.length > 0 ? clearFilters : undefined}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr
                    key={user.id}
                    className={
                      canManageUsers ? styles.clickableRow : undefined
                    }
                    tabIndex={canManageUsers ? 0 : undefined}
                    onClick={
                      canManageUsers
                        ? () => router.push(`/users/${user.id}`)
                        : undefined
                    }
                    onKeyDown={
                      canManageUsers
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              router.push(`/users/${user.id}`);
                            }
                          }
                        : undefined
                    }
                  >
                    <td>
                      <div className={styles.userCell}>
                        <UserAvatar seed={user.id} size={36} />
                        <div>
                          <div className={styles.userEmailRow}>
                            <span className={styles.userEmail}>{user.email}</span>
                            {user.id === currentUserId ? (
                              <span className={styles.youBadge}>You</span>
                            ) : null}
                          </div>
                          <span className={styles.userMeta}>
                            Updated {formatRelativeTime(user.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.roleBadge} ${roleBadgeClass(user.userType)}`}
                      >
                        <Shield size={14} aria-hidden />
                        {roleLabel(user.userType)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          user.isActive ? styles.statusActive : styles.statusInactive
                        }`}
                      >
                        {user.isActive ? (
                          <UserCheck size={14} aria-hidden />
                        ) : (
                          <UserX size={14} aria-hidden />
                        )}
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className={styles.mutedCell}>
                      {user.lastLoginAt
                        ? formatRelativeTime(user.lastLoginAt)
                        : "Never"}
                    </td>
                    <td className={styles.mutedCell}>
                      {formatBlogDate(user.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserModal
        open={modalOpen}
        pending={pending}
        onClose={() => {
          if (!pending) setModalOpen(false);
        }}
        onSubmit={handleCreateUser}
      />
    </div>
  );
}

