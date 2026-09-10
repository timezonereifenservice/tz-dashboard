import { getNavItems, type NavItem } from "@/lib/dashboard-nav";
import {
  canAccessProject,
  getAccessibleProjectIds,
  type UserType,
} from "@/lib/projects/access";
import { PROJECTS, type ProjectId } from "@/lib/projects/config";

export type ProjectNavPermissions = Record<string, boolean>;

export type GlobalNavPermissions = {
  users?: boolean;
};

export type UserNavPermissions = Partial<
  Record<ProjectId, ProjectNavPermissions>
> & {
  global?: GlobalNavPermissions;
};

const PROJECT_IDS = new Set<string>(PROJECTS.map((project) => project.id));

export function parseUserNavPermissions(value: unknown): UserNavPermissions {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;
  const parsed: UserNavPermissions = {};

  if (raw.global && typeof raw.global === "object" && !Array.isArray(raw.global)) {
    const global = raw.global as Record<string, unknown>;
    if (typeof global.users === "boolean") {
      parsed.global = { users: global.users };
    }
  }

  for (const [key, permissions] of Object.entries(raw)) {
    if (key === "global" || !PROJECT_IDS.has(key)) continue;
    if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
      continue;
    }
    parsed[key as ProjectId] = permissions as ProjectNavPermissions;
  }

  return parsed;
}

export function getDefaultUsersMenuAccess(userType: UserType): boolean {
  return userType === "ADMIN";
}

export function getEffectiveUsersMenuAccess(
  userType: UserType,
  navPermissions: UserNavPermissions,
): boolean {
  const stored = navPermissions.global?.users;
  if (stored !== undefined) return stored;
  return getDefaultUsersMenuAccess(userType);
}

export function canAccessUsersMenu(
  userType: UserType,
  navPermissions: UserNavPermissions,
): boolean {
  return getEffectiveUsersMenuAccess(userType, navPermissions);
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
  _userType: UserType,
  navPermissions: UserNavPermissions,
): UserNavPermissions {
  const sanitized: UserNavPermissions = {};

  if (typeof navPermissions.global?.users === "boolean") {
    sanitized.global = { users: navPermissions.global.users };
  }

  for (const project of PROJECTS) {
    sanitized[project.id] = getEffectiveProjectNavPermissions(
      project.id,
      navPermissions,
    );
  }

  return sanitized;
}

export function setUsersMenuAccess(
  navPermissions: UserNavPermissions,
  enabled: boolean,
): UserNavPermissions {
  return {
    ...navPermissions,
    global: {
      ...navPermissions.global,
      users: enabled,
    },
  };
}
