"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Typography, FormControl, Select, MenuItem } from "@mui/material";
import {
  Sidebar as MuiSidebar,
  Menu,
  MenuItem as SidebarMenuItem,
} from "react-mui-sidebar";
import { IconPoint } from "@tabler/icons-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { getNavItems, settingsNavItem } from "@/lib/dashboard-nav";
import { brand } from "@/lib/brand";
import type { ProjectConfig } from "@/lib/projects/config";

type SidebarItemsProps = {
  projects: ProjectConfig[];
  currentProject: ProjectConfig;
};

export function SidebarItems({ projects, currentProject }: SidebarItemsProps) {
  const pathname = usePathname();
  const navItems = getNavItems(currentProject.id);

  return (
    <MuiSidebar
      width="100%"
      showProfile={false}
      themeColor="#5D87FF"
      themeSecondaryColor="#49beff"
    >
      <Box px={3} py={2.5} borderBottom="1px solid" borderColor="divider">
        <BrandLogo href="/" variant="full" height={36} />
        <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
          {brand.tagline}
        </Typography>
      </Box>

      <Box px={3} py={2}>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mb: 1,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          Project
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={currentProject.id}
            onChange={(e) => {
              window.location.href = `/${e.target.value}/overview`;
            }}
            sx={{ borderRadius: "8px", bgcolor: "background.paper" }}
          >
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Menu subHeading="Navigation" />

      {navItems.map((item) => {
        const Icon = item.icon ?? IconPoint;
        const itemIcon = <Icon strokeWidth={1.5} size={20} />;
        const isSelected =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Box px={3} key={item.id}>
            <SidebarMenuItem
              isSelected={isSelected}
              borderRadius="8px"
              icon={itemIcon}
              link={item.href}
              component={Link}
            >
              {item.label}
            </SidebarMenuItem>
          </Box>
        );
      })}

      <Menu subHeading="Account" />

      <Box px={3}>
        <SidebarMenuItem
          isSelected={pathname === settingsNavItem.href}
          borderRadius="8px"
          icon={<settingsNavItem.icon strokeWidth={1.5} size={20} />}
          link={settingsNavItem.href}
          component={Link}
        >
          {settingsNavItem.label}
        </SidebarMenuItem>
      </Box>
    </MuiSidebar>
  );
}
