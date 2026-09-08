import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/components/shell/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/session";
import {
  canAccessProject,
  getAccessibleProjectIds,
} from "@/lib/projects/access";
import { PROJECTS, getProjectBySlug, type ProjectId } from "@/lib/projects/config";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ project: string }>;
};

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { project: projectSlug } = await params;
  const project = getProjectBySlug(projectSlug);
  if (!project) notFound();

  if (!canAccessProject(user.userType, project.id as ProjectId)) {
    redirect(`/${getAccessibleProjectIds(user.userType)[0]}/overview`);
  }

  const accessibleProjects = PROJECTS.filter((p) =>
    canAccessProject(user.userType, p.id),
  );

  return (
    <DashboardShell
      user={user}
      projects={accessibleProjects}
      currentProject={project}
    >
      {children}
    </DashboardShell>
  );
}
