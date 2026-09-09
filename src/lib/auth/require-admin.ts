import { getCurrentUser } from "@/lib/auth/session";
import type { DashboardUser } from "@/lib/auth/types";
import { canAccessUsersMenu } from "@/lib/users/nav-permissions";

export async function requireAdminUser(): Promise<DashboardUser | null> {
  const user = await getCurrentUser();
  if (!user || user.userType !== "ADMIN") {
    return null;
  }
  return user;
}

export async function requireUsersMenuAccess(): Promise<DashboardUser | null> {
  const user = await getCurrentUser();
  if (!user || !canAccessUsersMenu(user.userType, user.navPermissions)) {
    return null;
  }
  return user;
}
