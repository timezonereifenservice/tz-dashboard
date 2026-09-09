"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  Globe,
  Plus,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { CreateUserModal } from "@/components/users/create-user-modal";
import {
  ConnectivityErrorBanner,
  EmptyTableState,
  ToastNotification,
} from "@/components/system";
import type { UserType } from "@/lib/projects/access";
import type { HubUser } from "@/lib/users/types";
import { formatBlogDate, formatRelativeTime, getInitials } from "@/lib/utils";
import styles from "./users.module.css";

type UsersPanelProps = {
  users: HubUser[];
  currentUserId: string;
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
    };
  }, [users]);

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
          <h1 className={styles.title}>Users</h1>
          <p className={styles.description}>
            Manage ConsoleHub dashboard accounts. These users are shared across
            all properties and stored in the TZ Transport auth database.
          </p>
        </div>
        <div className={styles.scopeChip}>
          <Globe size={16} aria-hidden />
          <span>
            Dashboard-wide · <strong>Not project-specific</strong>
          </span>
        </div>
      </div>

      <div className={styles.infoBanner}>
        <div className={styles.infoIcon}>
          <Database size={18} aria-hidden />
        </div>
        <div>
          <p className={styles.infoTitle}>Global auth scope</p>
          <p className={styles.infoText}>
            User accounts apply to the entire dashboard. Switching projects in
            the sidebar does not change who can sign in — roles only control
            which properties each user can access.
          </p>
        </div>
      </div>

      {error ? (
        <ConnectivityErrorBanner
          title="Could not load dashboard users"
          message={error}
          onRetry={() => router.refresh()}
        />
      ) : null}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total users</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active</span>
          <span className={styles.statValue}>{stats.active}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Admins</span>
          <span className={styles.statValue}>{stats.admins}</span>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} aria-hidden />
              <input
                type="search"
                value={query}
                placeholder="Search by email…"
                className={styles.searchInput}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              className={styles.select}
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
            <select
              value={statusFilter}
              className={styles.select}
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
          </div>

          <div className={styles.toolbarRight}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => router.refresh()}
            >
              <RefreshCw size={16} aria-hidden />
              Refresh
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setModalOpen(true)}
            >
              <Plus size={16} aria-hidden />
              Create user
            </button>
          </div>
        </div>

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
                      title={users.length === 0 ? "No users yet" : "No matches"}
                      description={
                        users.length === 0
                          ? "Create the first dashboard user to grant ConsoleHub access."
                          : "Try adjusting your search or filters."
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.avatar}>{getInitials(user.email)}</span>
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
      </section>

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
