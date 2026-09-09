"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LayoutGrid,
  Save,
  Shield,
  UserCheck,
  UserCog,
  UserX,
} from "lucide-react";
import { UserAvatar } from "@/components/users/user-avatar";
import { ToastNotification } from "@/components/system";
import type { UserType } from "@/lib/projects/access";
import { PROJECTS, type ProjectId } from "@/lib/projects/config";
import {
  getDefaultProjectNavPermissions,
  getDefaultUsersMenuAccess,
  getEditableProjectsForRole,
  getEffectiveProjectNavPermissions,
  getEffectiveUsersMenuAccess,
  sanitizeNavPermissionsForRole,
  setUsersMenuAccess,
  type UserNavPermissions,
} from "@/lib/users/nav-permissions";
import { getNavItems } from "@/lib/dashboard-nav";
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
    hint: "Manage content and leads for TZ Transport and Take & Bring.",
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

  const editableProjects = useMemo(
    () =>
      PROJECTS.filter((project) =>
        getEditableProjectsForRole(userType).includes(project.id),
      ),
    [userType],
  );

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

  const usersMenuAccess = getEffectiveUsersMenuAccess(userType, navPermissions);
  const defaultUsersMenuAccess = getDefaultUsersMenuAccess(userType);

  function toggleUsersMenuAccess(enabled: boolean) {
    setNavPermissions((current) => setUsersMenuAccess(current, enabled));
  }

  function toggleNavItem(projectId: ProjectId, itemId: string, enabled: boolean) {
    setNavPermissions((current) => {
      const effective = getEffectiveProjectNavPermissions(projectId, current);
      return {
        ...current,
        [projectId]: {
          ...effective,
          [itemId]: enabled,
        },
      };
    });
  }

  function resetProjectNav(projectId: ProjectId) {
    setNavPermissions((current) => ({
      ...current,
      [projectId]: getDefaultProjectNavPermissions(projectId),
    }));
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
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleRow}>
              <LayoutGrid size={18} aria-hidden />
              <h2 className={styles.sectionTitle}>Sidebar menu access</h2>
            </div>
            <p className={styles.sectionHint}>
              Choose which navigation items appear for each property. Unchecked
              items are hidden from the sidebar for this user.
            </p>
          </div>

          <div className={styles.sectionBody}>
            <div className={styles.projectNavBlock}>
              <div className={styles.projectNavHeader}>
                <div>
                  <h3 className={styles.projectNavTitle}>Account menu</h3>
                  <p className={styles.projectNavHint}>
                    Controls whether the Users item appears in the sidebar
                    Account section.
                  </p>
                </div>
              </div>

              <label
                className={`${styles.navCheckItem} ${
                  isSelf ? styles.checkboxRowDisabled : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={usersMenuAccess}
                  disabled={pending || isSelf}
                  onChange={(event) =>
                    toggleUsersMenuAccess(event.target.checked)
                  }
                />
                <span className={styles.navCheckLabel}>
                  <UserCog size={16} aria-hidden />
                  Users management menu
                </span>
              </label>
              <p className={styles.fieldHint}>
                Default for {userType.toLowerCase()} accounts is{" "}
                {defaultUsersMenuAccess ? "enabled" : "disabled"}. Only admins
                can change this setting.
              </p>
              {isSelf ? (
                <p className={styles.fieldHint}>
                  You cannot remove your own Users menu access.
                </p>
              ) : null}
            </div>

            {editableProjects.length === 0 ? (
              <p className={styles.emptyHint}>
                This role has no property access to configure.
              </p>
            ) : (
              editableProjects.map((project) => {
                const navItems = getNavItems(project.id);
                const effective = getEffectiveProjectNavPermissions(
                  project.id,
                  navPermissions,
                );

                return (
                  <div key={project.id} className={styles.projectNavBlock}>
                    <div className={styles.projectNavHeader}>
                      <div>
                        <h3 className={styles.projectNavTitle}>
                          {project.name}
                        </h3>
                        <p className={styles.projectNavHint}>
                          {project.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={styles.textButton}
                        disabled={pending}
                        onClick={() => resetProjectNav(project.id)}
                      >
                        Enable all
                      </button>
                    </div>

                    <div className={styles.navChecklist}>
                      {navItems.map((item) => (
                        <label key={item.id} className={styles.navCheckItem}>
                          <input
                            type="checkbox"
                            checked={effective[item.id] !== false}
                            disabled={pending}
                            onChange={(event) =>
                              toggleNavItem(
                                project.id,
                                item.id,
                                event.target.checked,
                              )
                            }
                          />
                          <span className={styles.navCheckLabel}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
