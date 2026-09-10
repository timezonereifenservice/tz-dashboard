"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { settingsNavItem, usersNavItem } from "@/lib/dashboard-nav";
import {
  canAccessUsersMenu,
  getNavItemsForUser,
} from "@/lib/users/nav-permissions";
import { brand } from "@/lib/brand";
import { ProjectSwitcher } from "@/components/layout/project-switcher";
import { useLogout } from "@/hooks/use-logout";
import type { ProjectConfig } from "@/lib/projects/config";
import type { DashboardUser } from "@/lib/auth/types";
import styles from "./sidebar.module.css";

type AppSidebarProps = {
  projects: ProjectConfig[];
  currentProject: ProjectConfig;
  user: DashboardUser;
  newLeadsCount?: number;
  isOpen: boolean;
  onNavigate?: () => void;
};

export function AppSidebar({
  projects,
  currentProject,
  user,
  newLeadsCount = 0,
  isOpen,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { logout, pending } = useLogout();
  const navItems = getNavItemsForUser(
    currentProject.id,
    user.userType,
    user.navPermissions,
  );

  async function handleLogout() {
    await logout();
    onNavigate?.();
  }

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      aria-label="Main navigation"
    >
      <div className={styles.body}>
        <div className={styles.brandCard}>
          <div className={styles.brandTop}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentProject.iconSrc}
              alt=""
              className={styles.brandLogo}
            />
            <span className={styles.brandName}>{brand.name}</span>
          </div>
          <div className={styles.brandMeta}>
            <p className={styles.brandEmail}>
              <Mail size={14} aria-hidden />
              <span>{user.email}</span>
            </p>
            <p className={styles.brandRole}>
              <ShieldCheck size={14} aria-hidden />
              <span>{user.userType}</span>
            </p>
          </div>
        </div>

        <ProjectSwitcher projects={projects} currentProject={currentProject} />

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Navigation</span>
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                  aria-current={isActive ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <span className={styles.navLinkInner}>
                    <Icon size={18} strokeWidth={1.75} aria-hidden />
                    <span>{item.label}</span>
                  </span>
                  {item.id === "leads" && newLeadsCount > 0 ? (
                    <span className={styles.navBadge}>{newLeadsCount}</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Account</span>
          <nav className={styles.nav}>
            {canAccessUsersMenu(user.userType, user.navPermissions) ? (
              <Link
                href={usersNavItem.href}
                className={`${styles.navLink} ${
                  pathname === usersNavItem.href ||
                  pathname.startsWith(`${usersNavItem.href}/`)
                    ? styles.navLinkActive
                    : ""
                }`}
                onClick={onNavigate}
              >
                <span className={styles.navLinkInner}>
                  <usersNavItem.icon size={18} strokeWidth={1.75} aria-hidden />
                  <span>{usersNavItem.label}</span>
                </span>
              </Link>
            ) : null}
            <Link
              href={settingsNavItem.href}
              className={`${styles.navLink} ${
                pathname === settingsNavItem.href ? styles.navLinkActive : ""
              }`}
              onClick={onNavigate}
            >
              <span className={styles.navLinkInner}>
                <settingsNavItem.icon size={18} strokeWidth={1.75} aria-hidden />
                <span>{settingsNavItem.label}</span>
              </span>
            </Link>
          </nav>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.roleRow}>
          <span className={styles.roleLabel}>Role</span>
          <span className={styles.roleBadge}>{user.userType}</span>
        </div>
        <button
          type="button"
          className={styles.logoutButton}
          disabled={pending}
          onClick={handleLogout}
        >
          <LogOut size={18} aria-hidden />
          {pending ? "Logging out…" : "Logout"}
        </button>
      </div>
    </aside>
  );
}
