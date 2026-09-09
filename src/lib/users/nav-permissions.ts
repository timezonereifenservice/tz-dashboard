import { getNavItems, type NavItem } from "@/lib/dashboard-nav";
import {
  canAccessProject,
  getAccessibleProjectIds,
  type UserType,
} from "@/lib/projects/access";
import type { ProjectId } from "@/lib/projects/config";

export type ProjectNavPermissions = Record<string, boolean>;

export type UserNavPermissions = Partial<
  Record<ProjectId, ProjectNavPermissions>
>;

export function parseUserNavPermissions(value: unknown): UserNavPermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as UserNavPermissions;
}

export function getDefaultProjectNavPermissions(
  projectId: ProjectId,
): ProjectNavPermissions {
  const items = getNavItems(projectId);
  return Object.fromEntries(items.map((item) => [item.id, true]));
}

export function getEffectiveProjectNavPermissions(
  projectId: ProjectId,
  navPermissions: UserNavPermissions,
): ProjectNavPermissions {
  const defaults = getDefaultProjectNavPermissions(projectId);
  const overrides = navPermissions[projectId];
  if (!overrides) return defaults;
  return { ...defaults, ...overrides };
}

export function getNavItemsForUser(
  projectId: ProjectId,
  userType: UserType,
  navPermissions: UserNavPermissions,
): NavItem[] {
  if (!canAccessProject(userType, projectId)) {
    return [];
  }

  const items = getNavItems(projectId);
  const effective = getEffectiveProjectNavPermissions(projectId, navPermissions);
  return items.filter((item) => effective[item.id] !== false);
}

export function getEditableProjectsForRole(userType: UserType): ProjectId[] {
  return getAccessibleProjectIds(userType);
}

export function sanitizeNavPermissionsForRole(
  userType: UserType,
  navPermissions: UserNavPermissions,
): UserNavPermissions {
  const allowedProjects = new Set(getEditableProjectsForRole(userType));
  const sanitized: UserNavPermissions = {};

  for (const projectId of allowedProjects) {
    const effective = getEffectiveProjectNavPermissions(
      projectId,
      navPermissions,
    );
    sanitized[projectId] = effective;
  }

  return sanitized;
}
