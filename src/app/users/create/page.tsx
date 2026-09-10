import { redirect } from "next/navigation";
import { CreateUserPanel } from "@/components/users/create-user-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessUsersMenu } from "@/lib/users/nav-permissions";

export default async function CreateUserPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessUsersMenu(user.userType, user.navPermissions)) {
    redirect("/settings");
  }
  if (user.userType !== "ADMIN") redirect("/users");

  return <CreateUserPanel />;
}
