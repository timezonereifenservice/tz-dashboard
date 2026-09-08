"use client";

import { Box, Drawer, useMediaQuery } from "@mui/material";
import { SidebarItems } from "@/components/layout/sidebar-items";
import type { ProjectConfig } from "@/lib/projects/config";

type SidebarProps = {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  onSidebarClose: () => void;
  projects: ProjectConfig[];
  currentProject: ProjectConfig;
};

const sidebarWidth = "270px";

const scrollbarStyles = {
  "&::-webkit-scrollbar": { width: "7px" },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#eff2f7",
    borderRadius: "15px",
  },
};

export function Sidebar({
  isSidebarOpen,
  isMobileSidebarOpen,
  onSidebarClose,
  projects,
  currentProject,
}: SidebarProps) {
  const lgUp = useMediaQuery((theme: { breakpoints: { up: (key: string) => string } }) =>
    theme.breakpoints.up("lg"),
  );

  const drawerContent = (
    <Box sx={{ height: "100%" }}>
      <SidebarItems projects={projects} currentProject={currentProject} />
    </Box>
  );

  if (lgUp) {
    return (
      <Box sx={{ width: sidebarWidth, flexShrink: 0 }}>
        <Drawer
          anchor="left"
          open={isSidebarOpen}
          variant="permanent"
          slotProps={{
            paper: {
              sx: {
                boxSizing: "border-box",
                ...scrollbarStyles,
                width: sidebarWidth,
              },
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={isMobileSidebarOpen}
      onClose={onSidebarClose}
      variant="temporary"
      slotProps={{
        paper: {
          sx: {
            boxShadow: (theme) => theme.shadows[8],
            ...scrollbarStyles,
            width: sidebarWidth,
          },
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
