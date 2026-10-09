import { notFound, redirect } from "next/navigation";
import type { DashboardUser } from "@/lib/auth/types";
import { getCurrentUser } from "@/lib/auth/session";
import {
  canAccessProject,
  getAccessibleProjectIds,
} from "@/lib/projects/access";
import {
  getProjectBySlug,
  projectHasFeature,
  type ProjectConfig,
  type ProjectFeature,
  type ProjectId,
} from "@/lib/projects/config";
import {
  canAccessProjectNavItem,
  getProjectFallbackHref,
} from "@/lib/users/nav-permissions";

export type ProjectPageAccess = {
  user: DashboardUser;
  project: ProjectConfig;
};

/**
 * Auth + project + optional feature + sidebar nav permission.
 * Denied sections redirect to the first allowed page (usually overview).
 */
export async function requireProjectPageAccess(
  projectSlug: string,
  options: {
    navItemId: string;
    feature?: ProjectFeature;
  },
): Promise<ProjectPageAccess> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = getProjectBySlug(projectSlug);
  if (!project) notFound();

  if (!canAccessProject(user.userType, project.id as ProjectId)) {
    const fallback = getAccessibleProjectIds(user.userType)[0] ?? "tz-transport";
    redirect(`/${fallback}/overview`);
  }

  if (options.feature && !projectHasFeature(project, options.feature)) {
    redirect(
      getProjectFallbackHref(project.id, user.userType, user.navPermissions),
    );
  }

  if (
    !canAccessProjectNavItem(
      project.id,
      options.navItemId,
      user.userType,
      user.navPermissions,
    )
  ) {
    redirect(
      getProjectFallbackHref(project.id, user.userType, user.navPermissions),
    );
  }

  return { user, project };
}
