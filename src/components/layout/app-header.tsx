"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, LogOut, Menu, Settings, UserCog } from "lucide-react";
import { UserAvatar } from "@/components/users/user-avatar";
import { usersNavItem } from "@/lib/dashboard-nav";
import { canAccessUsersMenu } from "@/lib/users/nav-permissions";
import type { ProjectConfig } from "@/lib/projects/config";
import type { DashboardUser } from "@/lib/auth/types";
import styles from "./header.module.css";

type AppHeaderProps = {
  currentProject: ProjectConfig;
  user: DashboardUser;
  onMenuClick: () => void;
};

export function AppHeader({ currentProject, user, onMenuClick }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const isGlobalPage = pathname.startsWith("/settings") || pathname.startsWith("/users");
  const breadcrumbCurrent = isGlobalPage
    ? pathname.startsWith("/users")
      ? "Users"
      : "Settings"
    : currentProject.name;
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  async function logout() {
    setLogoutPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLogoutPending(false);
      setMenuOpen(false);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <span className={styles.breadcrumbMuted}>Console</span>
          <ChevronRight size={16} className={styles.breadcrumbMuted} aria-hidden />
          <span className={styles.breadcrumbCurrent}>{breadcrumbCurrent}</span>
        </nav>
      </div>

      <div className={styles.right}>
        <div className={styles.profileWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.profileButton}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <UserAvatar seed={user.id} size={36} />
            <ChevronDown size={16} className={styles.profileChevron} aria-hidden />
          </button>

          {menuOpen ? (
            <div className={styles.menu} role="menu">
              <div className={styles.menuMeta}>
                <div className={styles.menuEmail}>{user.email}</div>
                <div className={styles.menuRole}>{user.userType}</div>
              </div>
              {canAccessUsersMenu(user.userType, user.navPermissions) ? (
                <Link
                  href={usersNavItem.href}
                  className={styles.menuLink}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserCog size={18} aria-hidden />
                  Users
                </Link>
              ) : null}
              <Link
                href="/settings"
                className={styles.menuLink}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                <Settings size={18} aria-hidden />
                Settings
              </Link>
              <button
                type="button"
                className={styles.menuLogout}
                role="menuitem"
                disabled={logoutPending}
                onClick={logout}
              >
                <LogOut size={18} aria-hidden />
                {logoutPending ? "Logging out…" : "Logout"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
