import type { UserType } from "@/lib/projects/access";
import type { UserNavPermissions } from "@/lib/users/nav-permissions";

export type HubUser = {
  id: string;
  email: string;
  userType: UserType;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  navPermissions: UserNavPermissions;
};

export type CreateHubUserInput = {
  email: string;
  password: string;
  userType: UserType;
  isActive?: boolean;
};

export type UpdateHubUserInput = {
  userType?: UserType;
  isActive?: boolean;
  navPermissions?: UserNavPermissions;
};
