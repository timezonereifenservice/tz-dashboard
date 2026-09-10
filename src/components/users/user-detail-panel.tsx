"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Shield,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { ConfirmUserActionModal } from "@/components/users/confirm-user-action-modal";
import { UserAvatar } from "@/components/users/user-avatar";
import { UserNavPermissionsEditor } from "@/components/users/user-nav-permissions-editor";
import { ToastNotification } from "@/components/system";
import type { UserType } from "@/lib/projects/access";
import {
  sanitizeNavPermissionsForRole,
  type UserNavPermissions,
} from "@/lib/users/nav-permissions";
import type { HubUser } from "@/lib/users/types";
import { formatBlogDate, formatRelativeTime } from "@/lib/utils";
import styles from "./users.module.css";

type UserDetailPanelProps = {
  user: HubUser;
  currentUserId: string;
};

const ROLE_OPTIONS: { value: UserType; label: string; hint: string }[] = [
  {
    value: "ADMIN",
    label: "Admin",
    hint: "Full access to all properties and user management.",
  },
  {
    value: "EDITOR",
    label: "Editor",
    hint: "Manage content and leads for TZ Transport, Take & Bring, and TZ Reifenservice.",
  },
  {
    value: "VIEWER",
    label: "Viewer",
    hint: "Read-only access to TZ Transport dashboards.",
  },
];

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

export function UserDetailPanel({ user, currentUserId }: UserDetailPanelProps) {
  const router = useRouter();
  const isSelf = user.id === currentUserId;

  const [userType, setUserType] = useState<UserType>(user.userType);
  const [isActive, setIsActive] = useState(user.isActive);
  const [navPermissions, setNavPermissions] = useState<UserNavPermissions>(
    user.navPermissions,
  );
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [toast, setToast] = useState<{
    variant: "success" | "error";
    title: string;
    meta?: string;
  } | null>(null);

  useEffect(() => {
    setUserType(user.userType);
    setIsActive(user.isActive);
    setNavPermissions(user.navPermissions);
  }, [user]);

  const isDirty =
    userType !== user.userType ||
    isActive !== user.isActive ||
    JSON.stringify(navPermissions) !== JSON.stringify(user.navPermissions);

  function handleRoleChange(nextRole: UserType) {
    setUserType(nextRole);
    setNavPermissions((current) =>
      sanitizeNavPermissionsForRole(nextRole, current),
    );
  }

  async function handleSave() {
    setPending(true);
    setToast(null);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userType,
          isActive,
          navPermissions: sanitizeNavPermissionsForRole(userType, navPermissions),
        }),
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to update user.");
      }

      setToast({
        variant: "success",
        title: "User updated",
        meta: "Access changes take effect on the user's next page load.",
      });
      router.refresh();
    } catch (error) {
      setToast({
        variant: "error",
        title: "Update failed",
        meta:
          error instanceof Error ? error.message : "Unable to update user.",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setDeletePending(true);
    setToast(null);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Unable to delete user.");
      }

      router.push("/users");
      router.refresh();
    } catch (error) {
      setDeleteOpen(false);
      setToast({
        variant: "error",
        title: "Delete failed",
        meta:
          error instanceof Error ? error.message : "Unable to delete user.",
      });
    } finally {
      setDeletePending(false);
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

      <div className={styles.detailHeader}>
        <Link href="/users" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden />
          Back to users
        </Link>
        <div className={styles.detailHeaderActions}>
          {!isSelf ? (
            <button
              type="button"
              className={styles.dangerButton}
              disabled={pending || deletePending}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={16} aria-hidden />
              Delete user
            </button>
          ) : null}
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!isDirty || pending}
            onClick={handleSave}
          >
            <Save size={16} aria-hidden />
            {pending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>

      <section className={styles.detailHero}>
        <UserAvatar seed={user.id} size={72} />
        <div className={styles.detailHeroText}>
          <div className={styles.userEmailRow}>
            <h1 className={styles.detailTitle}>{user.email}</h1>
            {isSelf ? <span className={styles.youBadge}>You</span> : null}
          </div>
          <div className={styles.detailMetaRow}>
            <span
              className={`${styles.roleBadge} ${roleBadgeClass(user.userType)}`}
            >
              <Shield size={14} aria-hidden />
              {user.userType}
            </span>
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
            <span className={styles.detailMeta}>
              Last login{" "}
              {user.lastLoginAt
                ? formatRelativeTime(user.lastLoginAt)
                : "never"}
            </span>
            <span className={styles.detailMeta}>
              Created {formatBlogDate(user.createdAt)}
            </span>
          </div>
        </div>
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.card}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Role & account</h2>
            <p className={styles.sectionHint}>
              Controls which properties this user can open and whether they can
              manage dashboard content.
            </p>
          </div>

          <div className={styles.sectionBody}>
            <div className={styles.field}>
              <span className={styles.label}>Role</span>
              <div className={styles.roleGrid}>
                {ROLE_OPTIONS.map((option) => {
                  const disabled =
                    pending || (isSelf && option.value !== "ADMIN");
                  return (
                    <label
                      key={option.value}
                      className={`${styles.roleOption} ${
                        userType === option.value ? styles.roleOptionActive : ""
                      } ${disabled ? styles.roleOptionDisabled : ""}`}
                    >
                      <input
                        type="radio"
                        name="userType"
                        value={option.value}
                        checked={userType === option.value}
                        disabled={disabled}
                        className={styles.roleInput}
                        onChange={() => handleRoleChange(option.value)}
                      />
                      <span className={styles.roleOptionLabel}>
                        {option.label}
                      </span>
                      <span className={styles.roleOptionHint}>
                        {option.hint}
                      </span>
                    </label>
                  );
                })}
              </div>
              {isSelf ? (
                <p className={styles.fieldHint}>
                  Your admin role cannot be changed while signed in.
                </p>
              ) : null}
            </div>

            <label
              className={`${styles.checkboxRow} ${
                isSelf ? styles.checkboxRowDisabled : ""
              }`}
            >
              <input
                type="checkbox"
                checked={isActive}
                disabled={pending || isSelf}
                onChange={(event) => setIsActive(event.target.checked)}
              />
              <span>Account is active and can sign in</span>
            </label>
            {isSelf ? (
              <p className={styles.fieldHint}>
                You cannot deactivate your own account.
              </p>
            ) : null}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionBody}>
            <UserNavPermissionsEditor
              userType={userType}
              navPermissions={navPermissions}
              disabled={pending}
              disableUsersMenuToggle={isSelf}
              onChange={setNavPermissions}
            />
            {isSelf ? (
              <p className={styles.fieldHint}>
                You cannot remove your own Users menu access.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      <ConfirmUserActionModal
        open={deleteOpen}
        pending={deletePending}
        title="Delete user"
        description={`Permanently remove ${user.email}? This cannot be undone.`}
        confirmLabel="Delete user"
        danger
        onClose={() => {
          if (!deletePending) setDeleteOpen(false);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
