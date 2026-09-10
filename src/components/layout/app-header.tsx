"use client";

import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { brand } from "@/lib/brand";
import { useLogout } from "@/hooks/use-logout";
import type { ProjectConfig } from "@/lib/projects/config";
import styles from "./header.module.css";

type AppHeaderProps = {
  currentProject: ProjectConfig;
  onMenuClick: () => void;
};

export function AppHeader({ currentProject, onMenuClick }: AppHeaderProps) {
  const pathname = usePathname();
  const { logout, pending } = useLogout();
  const isGlobalPage =
    pathname.startsWith("/settings") || pathname.startsWith("/users");
  const breadcrumbCurrent = isGlobalPage
    ? pathname.startsWith("/users")
      ? "Users"
      : "Settings"
    : currentProject.name;

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
          <span className={styles.breadcrumbMuted}>{brand.name}</span>
          <span className={styles.breadcrumbCurrent}>{breadcrumbCurrent}</span>
        </nav>
      </div>

      <div className={styles.right}>
        <button
          type="button"
          className={styles.logoutBtn}
          disabled={pending}
          onClick={logout}
        >
          <LogOut size={14} aria-hidden />
          {pending ? "…" : "Logout"}
        </button>
      </div>
    </header>
  );
}
