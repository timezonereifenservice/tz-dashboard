import type { UserType } from "@/lib/projects/access";

export type HubUser = {
  id: string;
  email: string;
  userType: UserType;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateHubUserInput = {
  email: string;
  password: string;
  userType: UserType;
  isActive?: boolean;
};
