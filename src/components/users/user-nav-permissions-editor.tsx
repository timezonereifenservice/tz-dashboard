"use client";

import { LayoutGrid, UserCog } from "lucide-react";
import { getNavItems } from "@/lib/dashboard-nav";
import {
  canAccessProject,
  type UserType,
} from "@/lib/projects/access";
import { PROJECTS, type ProjectId } from "@/lib/projects/config";
import {
  getDefaultProjectNavPermissions,
  getDefaultUsersMenuAccess,
  getEffectiveProjectNavPermissions,
  getEffectiveUsersMenuAccess,
  setUsersMenuAccess,
  type UserNavPermissions,
} from "@/lib/users/nav-permissions";
import styles from "./users.module.css";

type UserNavPermissionsEditorProps = {
  userType: UserType;
  navPermissions: UserNavPermissions;
  onChange: (next: UserNavPermissions) => void;
  disabled?: boolean;
  disableUsersMenuToggle?: boolean;
  showHeading?: boolean;
};

export function UserNavPermissionsEditor({
  userType,
  navPermissions,
  onChange,
  disabled = false,
  disableUsersMenuToggle = false,
  showHeading = true,
}: UserNavPermissionsEditorProps) {
  const usersMenuAccess = getEffectiveUsersMenuAccess(userType, navPermissions);
  const defaultUsersMenuAccess = getDefaultUsersMenuAccess(userType);

  function toggleUsersMenuAccess(enabled: boolean) {
    onChange(setUsersMenuAccess(navPermissions, enabled));
  }

  function toggleNavItem(projectId: ProjectId, itemId: string, enabled: boolean) {
    const effective = getEffectiveProjectNavPermissions(projectId, navPermissions);
    onChange({
      ...navPermissions,
      [projectId]: {
        ...effective,
        [itemId]: enabled,
      },
    });
  }

  function resetProjectNav(projectId: ProjectId) {
    onChange({
      ...navPermissions,
      [projectId]: getDefaultProjectNavPermissions(projectId),
    });
  }

  return (
    <div className={styles.navPermissionsEditor}>
      {showHeading ? (
        <div className={styles.sectionHeaderInline}>
          <div className={styles.sectionTitleRow}>
            <LayoutGrid size={18} aria-hidden />
            <h3 className={styles.sectionTitle}>Sidebar menu access</h3>
          </div>
          <p className={styles.sectionHint}>
            Choose which navigation items appear for each property. Unchecked items
            are hidden from the sidebar for this user.
          </p>
        </div>
      ) : null}

      <div className={styles.projectNavBlock}>
        <div className={styles.projectNavHeader}>
          <div>
            <h4 className={styles.projectNavTitle}>Account menu</h4>
            <p className={styles.projectNavHint}>
              Controls whether the Users item appears in the sidebar Account section.
            </p>
          </div>
        </div>

        <label
          className={`${styles.navCheckItem} ${
            disableUsersMenuToggle ? styles.checkboxRowDisabled : ""
          }`}
        >
          <input
            type="checkbox"
            checked={usersMenuAccess}
            disabled={disabled || disableUsersMenuToggle}
            onChange={(event) => toggleUsersMenuAccess(event.target.checked)}
          />
          <span className={styles.navCheckLabel}>
            <UserCog size={16} aria-hidden />
            Users management menu
          </span>
        </label>
        <p className={styles.fieldHint}>
          Default for {userType.toLowerCase()} accounts is{" "}
          {defaultUsersMenuAccess ? "enabled" : "disabled"}.
        </p>
      </div>

      {PROJECTS.map((project) => {
          const navItems = getNavItems(project.id);
          const effective = getEffectiveProjectNavPermissions(
            project.id,
            navPermissions,
          );
          const roleHasProjectAccess = canAccessProject(userType, project.id);

          return (
            <div key={project.id} className={styles.projectNavBlock}>
              <div className={styles.projectNavHeader}>
                <div>
                  <h4 className={styles.projectNavTitle}>{project.name}</h4>
                  <p className={styles.projectNavHint}>{project.description}</p>
                  {!roleHasProjectAccess ? (
                    <p className={styles.fieldHint}>
                      This role cannot open this property; menu settings apply if
                      access is granted later.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className={styles.textButton}
                  disabled={disabled}
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
                      disabled={disabled}
                      onChange={(event) =>
                        toggleNavItem(project.id, item.id, event.target.checked)
                      }
                    />
                    <span className={styles.navCheckLabel}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
    </div>
  );
}
