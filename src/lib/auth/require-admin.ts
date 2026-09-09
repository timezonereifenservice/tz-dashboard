import { getCurrentUser } from "@/lib/auth/session";
import type { DashboardUser } from "@/lib/auth/types";

export async function requireAdminUser(): Promise<DashboardUser | null> {
  const user = await getCurrentUser();
  if (!user || user.userType !== "ADMIN") {
    return null;
  }
  return user;
}
