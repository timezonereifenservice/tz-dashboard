"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { getNavItems, settingsNavItem } from "@/lib/dashboard-nav";
import { brand } from "@/lib/brand";
import { getProjectMeta } from "@/lib/projects/meta";
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
  const navItems = getNavItems(currentProject.id);
  const meta = getProjectMeta(currentProject.id);

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      aria-label="Main navigation"
    >
      <div className={styles.body}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={brand.markSrc} alt="" className={styles.logo} />
          <div className={styles.brandText}>
            <span className={styles.brandName}>{brand.name}</span>
            <span className={styles.brandTagline}>{brand.tagline}</span>
          </div>
        </div>

        <div className={styles.projectSwitcher}>
          <label className={styles.projectButton}>
            <span className={styles.projectInfo}>
              <span className={styles.projectDot} aria-hidden />
              <span>
                <span className={styles.projectName}>{currentProject.name}</span>
                <span className={styles.projectDomain}>{meta.domain}</span>
              </span>
            </span>
            <ChevronDown size={18} aria-hidden />
            <select
              className={styles.projectSelect}
              value={currentProject.id}
              aria-label="Switch project"
              onChange={(e) => {
                window.location.href = `/${e.target.value}/overview`;
              }}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        </div>

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
                    <Icon size={20} strokeWidth={1.75} aria-hidden />
                    <span>{item.label}</span>
                  </span>
                  {item.id === "leads" && newLeadsCount > 0 ? (
                    <span className={styles.navBadge}>{newLeadsCount}</span>
                  ) : null}
                  {item.id === "chatbot-leads" ? (
                    <span className={styles.navHint}>TZ</span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.section}>
          <span className={styles.sectionLabel}>Account</span>
          <nav className={styles.nav}>
            <Link
              href={settingsNavItem.href}
              className={`${styles.navLink} ${
                pathname === settingsNavItem.href ? styles.navLinkActive : ""
              }`}
              onClick={onNavigate}
            >
              <span className={styles.navLinkInner}>
                <settingsNavItem.icon size={20} strokeWidth={1.75} aria-hidden />
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
        <div className={styles.footerMeta}>
          <span>{brand.name}</span>
        </div>
      </div>
    </aside>
  );
}
