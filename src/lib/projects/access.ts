import type { ProjectId } from "@/lib/projects/config";

export type UserType = "ADMIN" | "EDITOR" | "VIEWER";

const ACCESS_MAP: Record<UserType, ProjectId[]> = {
  ADMIN: ["take-bring", "tz-transport", "tz-reifenservice"],
  EDITOR: ["take-bring", "tz-transport"],
  VIEWER: ["tz-transport"],
};

export function getAccessibleProjectIds(userType: UserType): ProjectId[] {
  return ACCESS_MAP[userType] ?? [];
}

export function canAccessProject(
  userType: UserType,
  projectId: ProjectId,
): boolean {
  return getAccessibleProjectIds(userType).includes(projectId);
}

export function getDefaultProjectId(userType: UserType): ProjectId {
  const ids = getAccessibleProjectIds(userType);
  return ids[0] ?? "tz-transport";
}
