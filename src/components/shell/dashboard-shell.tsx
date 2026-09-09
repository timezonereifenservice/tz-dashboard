"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import type { ProjectConfig } from "@/lib/projects/config";
import type { DashboardUser } from "@/lib/auth/types";
import shellStyles from "@/components/layout/dashboard-shell.module.css";
import "@/styles/dashboard-tokens.css";

type DashboardShellProps = {
  user: DashboardUser;
  projects: ProjectConfig[];
  currentProject: ProjectConfig;
  newLeadsCount?: number;
  children: React.ReactNode;
};

export function DashboardShell({
  user,
  projects,
  currentProject,
  newLeadsCount = 0,
  children,
}: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div
      className={shellStyles.shell}
      data-project={currentProject.id}
    >
      <div className={shellStyles.layout}>
        {mobileSidebarOpen ? (
          <button
            type="button"
            className={shellStyles.overlay}
            aria-label="Close navigation"
            onClick={() => setMobileSidebarOpen(false)}
          />
        ) : null}

        <AppSidebar
          projects={projects}
          currentProject={currentProject}
          user={user}
          newLeadsCount={newLeadsCount}
          isOpen={mobileSidebarOpen}
          onNavigate={() => setMobileSidebarOpen(false)}
        />

        <div className={shellStyles.contentWrap}>
          <AppHeader
            currentProject={currentProject}
            user={user}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />

          <main className={shellStyles.main}>
            <div className={shellStyles.pageContent}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
