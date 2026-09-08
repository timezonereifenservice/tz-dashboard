"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Box, Container, styled } from "@mui/material";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { getPageTitle } from "@/lib/dashboard-nav";
import type { ProjectConfig } from "@/lib/projects/config";
import type { DashboardUser } from "@/lib/auth/types";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  paddingBottom: "60px",
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "transparent",
}));

type DashboardShellProps = {
  user: DashboardUser;
  projects: ProjectConfig[];
  currentProject: ProjectConfig;
  children: React.ReactNode;
};

export function DashboardShell({
  user,
  projects,
  currentProject,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  return (
    <MainWrapper>
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
        projects={projects}
        currentProject={currentProject}
      />

      <PageWrapper>
        <Header
          toggleMobileSidebar={() => setMobileSidebarOpen(true)}
          pageTitle={pageTitle}
          user={user}
        />
        <Container
          maxWidth="lg"
          sx={{
            paddingTop: "20px",
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
        </Container>
      </PageWrapper>
    </MainWrapper>
  );
}
