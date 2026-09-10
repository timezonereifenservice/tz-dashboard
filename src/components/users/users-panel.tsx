"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { ConfirmUserActionModal } from "@/components/users/confirm-user-action-modal";
import { UserAvatar } from "@/components/users/user-avatar";
import { DashboardPageHeader } from "@/components/ui/tz-dashboard";
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
  const [refreshPending, setRefreshPending] = useState(false);
  const [toast, setToast] = useState<{
    variant: "success" | "error";
    title: string;
    meta?: string;
  } | null>(null);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "delete" | "toggle-active";
    user: HubUser;
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

  async function handleConfirmAction() {
    if (!confirmAction) return;

    const { type, user } = confirmAction;
    setActionPendingId(user.id);
    setToast(null);

    try {
      if (type === "delete") {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "DELETE",
        });
        const payload = (await response.json()) as { message?: string };
        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to delete user.");
        }
        setToast({
          variant: "success",
          title: "User deleted",
          meta: `${user.email} was removed from ConsoleHub.`,
        });
      } else {
        const response = await fetch(`/api/users/${user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !user.isActive }),
        });
        const payload = (await response.json()) as { message?: string };
        if (!response.ok) {
          throw new Error(payload.message ?? "Unable to update user.");
        }
        setToast({
          variant: "success",
          title: user.isActive ? "User deactivated" : "User activated",
          meta: user.isActive
            ? `${user.email} can no longer sign in.`
            : `${user.email} can sign in again.`,
        });
      }

      setConfirmAction(null);
      router.refresh();
    } catch (error) {
      setToast({
        variant: "error",
        title: type === "delete" ? "Delete failed" : "Update failed",
        meta:
          error instanceof Error ? error.message : "Unable to complete action.",
      });
      setConfirmAction(null);
    } finally {
      setActionPendingId(null);
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

      <DashboardPageHeader
        eyebrow="User Management"
        title="Users"
        description="Manage dashboard accounts, roles, and sidebar access for your team."
        actions={
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
              <Link href="/users/create" className={styles.primaryButton}>
                <Plus size={16} aria-hidden />
                Create user
              </Link>
            ) : null}
          </div>
        }
      />

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
                {canManageUsers ? <th className={styles.actionCell}>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManageUsers ? 6 : 5}>
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
                    {canManageUsers ? (
                      <td className={styles.actionCell}>
                        <div
                          className={styles.actionButtons}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                        >
                          <Link
                            className={styles.editLink}
                            href={`/users/${user.id}`}
                            title="Edit user"
                            aria-label={`Edit ${user.email}`}
                          >
                            <Pencil size={16} aria-hidden />
                          </Link>
                          {user.id !== currentUserId ? (
                            <>
                              <button
                                type="button"
                                className={styles.toggleLink}
                                title={
                                  user.isActive ? "Deactivate user" : "Activate user"
                                }
                                aria-label={
                                  user.isActive
                                    ? `Deactivate ${user.email}`
                                    : `Activate ${user.email}`
                                }
                                disabled={actionPendingId === user.id}
                                onClick={() =>
                                  setConfirmAction({
                                    type: "toggle-active",
                                    user,
                                  })
                                }
                              >
                                {user.isActive ? (
                                  <UserX size={16} aria-hidden />
                                ) : (
                                  <UserCheck size={16} aria-hidden />
                                )}
                              </button>
                              <button
                                type="button"
                                className={styles.deleteLink}
                                title="Delete user"
                                aria-label={`Delete ${user.email}`}
                                disabled={actionPendingId === user.id}
                                onClick={() =>
                                  setConfirmAction({ type: "delete", user })
                                }
                              >
                                <Trash2 size={16} aria-hidden />
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmAction ? (
        <ConfirmUserActionModal
          open
          pending={actionPendingId === confirmAction.user.id}
          title={
            confirmAction.type === "delete"
              ? "Delete user"
              : confirmAction.user.isActive
                ? "Deactivate user"
                : "Activate user"
          }
          description={
            confirmAction.type === "delete"
              ? `Permanently remove ${confirmAction.user.email}? This cannot be undone.`
              : confirmAction.user.isActive
                ? `${confirmAction.user.email} will no longer be able to sign in.`
                : `${confirmAction.user.email} will be able to sign in again.`
          }
          confirmLabel={
            confirmAction.type === "delete"
              ? "Delete user"
              : confirmAction.user.isActive
                ? "Deactivate"
                : "Activate"
          }
          danger={confirmAction.type === "delete"}
          onClose={() => {
            if (!actionPendingId) setConfirmAction(null);
          }}
          onConfirm={handleConfirmAction}
        />
      ) : null}
    </div>
  );
}

