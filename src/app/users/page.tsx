import { redirect } from "next/navigation";
import { UsersPanel } from "@/components/users/users-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { listHubUsers } from "@/lib/users/queries";
import type { HubUser } from "@/lib/users/types";
import { canAccessUsersMenu } from "@/lib/users/nav-permissions";

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessUsersMenu(user.userType, user.navPermissions)) {
    redirect("/settings");
  }

  let users: HubUser[] = [];
  let error: string | null = null;

  try {
    users = await listHubUsers();
  } catch (err) {
    console.error("[users/page]", err);
    error =
      err instanceof Error &&
      err.message.includes("Missing TZ_TRANSPORT_DATABASE_URL")
        ? "Database not configured. Add TZ_TRANSPORT_DATABASE_URL to .env.local and restart the dev server."
        : "Unable to load dashboard users right now.";
  }

  return (
    <UsersPanel
      users={users}
      currentUserId={user.id}
      canManageUsers={user.userType === "ADMIN"}
      error={error}
    />
  );
}
