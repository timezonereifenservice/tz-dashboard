import {
  BarChart3,
  Bot,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ProjectFeature, ProjectId } from "@/lib/projects/config";
import { projectHasFeature, getProjectBySlug } from "@/lib/projects/config";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  feature?: ProjectFeature;
};

export function getNavItems(projectId: ProjectId): NavItem[] {
  const project = getProjectBySlug(projectId);
  if (!project) return [];

  const base = `/${projectId}`;
  const items: NavItem[] = [
    {
      id: "overview",
      label: "Overview",
      href: `${base}/overview`,
      icon: LayoutDashboard,
      feature: "overview",
    },
    {
      id: "analytics",
      label: "Website Analytics",
      href: `${base}/website-analytics`,
      icon: BarChart3,
      feature: "analytics",
    },
    {
      id: "leads",
      label: "Leads",
      href: `${base}/leads`,
      icon: Users,
      feature: "leads",
    },
    {
      id: "chatbot-leads",
      label: "Chatbot Leads",
      href: `${base}/chatbot-leads`,
      icon: Bot,
      feature: "chatbot-leads",
    },
    {
      id: "blogs",
      label: "Blogs",
      href: `${base}/blogs`,
      icon: FileText,
      feature: "blogs",
    },
  ];

  return items.filter(
    (item) => !item.feature || projectHasFeature(project, item.feature),
  );
}

export const usersNavItem: NavItem = {
  id: "users",
  label: "Users",
  href: "/users",
  icon: UserCog,
};

export const settingsNavItem: NavItem = {
  id: "settings",
  label: "Settings",
  href: "/settings",
  icon: Settings,
};

export const logoutNavItem = {
  label: "Log out",
  icon: LogOut,
};

export function getPageTitle(pathname: string): string {
  if (pathname.includes("/website-analytics")) return "Website Analytics";
  if (pathname.includes("/chatbot-leads")) return "Chatbot Leads";
  if (pathname.includes("/blogs")) return "Blogs";
  if (pathname.includes("/leads")) return "Leads";
  if (pathname.includes("/overview")) return "Overview";
  if (pathname.includes("/settings")) return "Settings";
  if (pathname.includes("/users")) return "Users";
  return "Dashboard";
}
