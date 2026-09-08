import type { UserType } from "@/lib/projects/access";

export type DashboardUser = {
  id: string;
  email: string;
  userType: UserType;
  isActive: boolean;
};
