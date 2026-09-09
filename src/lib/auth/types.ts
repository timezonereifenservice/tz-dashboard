import type { UserType } from "@/lib/projects/access";
import type { UserNavPermissions } from "@/lib/users/nav-permissions";

export type DashboardUser = {
  id: string;
  email: string;
  userType: UserType;
  isActive: boolean;
  navPermissions: UserNavPermissions;
};
