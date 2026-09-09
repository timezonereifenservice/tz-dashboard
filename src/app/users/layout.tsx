import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessProject, getAccessibleProjectIds } from "@/lib/projects/access";
import { PROJECTS, type ProjectId } from "@/lib/projects/config";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.userType !== "ADMIN") redirect("/settings");

  const accessibleProjects = PROJECTS.filter((p) =>
    canAccessProject(user.userType, p.id as ProjectId),
  );
  const defaultId = getAccessibleProjectIds(user.userType)[0] ?? "tz-transport";
  const currentProject =
    accessibleProjects.find((p) => p.id === defaultId) ?? accessibleProjects[0] ?? PROJECTS[1];

  return (
    <DashboardShell
      user={user}
      projects={accessibleProjects}
      currentProject={currentProject}
    >
      {children}
    </DashboardShell>
  );
}
