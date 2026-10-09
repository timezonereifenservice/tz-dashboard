import { getCurrentUser } from "@/lib/auth/session";
import { canManageProjectContent } from "@/lib/projects/access";
import type { ProjectId } from "@/lib/projects/config";
import { canAccessProjectNavItem } from "@/lib/users/nav-permissions";

export async function requireBlogWriter(projectId?: ProjectId) {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, status: 401, error: "Unauthorized." };
  }
  if (!canManageProjectContent(user.userType)) {
    return { ok: false as const, status: 403, error: "Forbidden." };
  }

  if (projectId) {
    if (
      !canAccessProjectNavItem(
        projectId,
        "blogs",
        user.userType,
        user.navPermissions,
      )
    ) {
      return { ok: false as const, status: 403, error: "Forbidden." };
    }
  }

  return { ok: true as const, user };
}
