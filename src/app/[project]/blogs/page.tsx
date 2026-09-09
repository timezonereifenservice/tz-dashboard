import { notFound, redirect } from "next/navigation";
import { BlogsPanel } from "@/components/blogs/blogs-panel";
import { getAdapter } from "@/lib/adapters/registry";
import type { UnifiedBlog } from "@/lib/adapters/types";
import { getErrorMessage } from "@/lib/adapters/errors";
import { getCurrentUser } from "@/lib/auth/session";
import { supportsBlogCreation } from "@/lib/blogs/create";
import {
  canAccessProject,
  canManageProjectContent,
} from "@/lib/projects/access";
import { getProjectBySlug, projectHasFeature, type ProjectId } from "@/lib/projects/config";

type PageProps = { params: Promise<{ project: string }> };

export default async function BlogsPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { project: slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || !projectHasFeature(project, "blogs")) notFound();
  if (!canAccessProject(user.userType, project.id as ProjectId)) notFound();

  const adapter = getAdapter(project.id as ProjectId);
  if (!adapter.listBlogs) notFound();

  let blogs: UnifiedBlog[] = [];
  let error: string | null = null;
  const syncedAt = new Date().toISOString();

  try {
    blogs = await adapter.listBlogs();
  } catch (e) {
    error = getErrorMessage(e);
    console.error(`[blogs/${slug}]`, e);
  }

  const canCreate =
    canManageProjectContent(user.userType) &&
    supportsBlogCreation(project.id as ProjectId);

  return (
    <BlogsPanel
      project={project}
      blogs={blogs}
      error={error}
      syncedAt={syncedAt}
      canCreate={canCreate}
    />
  );
}
