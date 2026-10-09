import { redirect } from "next/navigation";
import { BlogsPanel } from "@/components/blogs/blogs-panel";
import { getAdapter } from "@/lib/adapters/registry";
import type { UnifiedBlog } from "@/lib/adapters/types";
import { getErrorMessage } from "@/lib/adapters/errors";
import { supportsBlogCreation } from "@/lib/blogs/create";
import { canManageProjectContent } from "@/lib/projects/access";
import type { ProjectId } from "@/lib/projects/config";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";
import { getProjectFallbackHref } from "@/lib/users/nav-permissions";

type PageProps = { params: Promise<{ project: string }> };

export default async function BlogsPage({ params }: PageProps) {
  const { project: slug } = await params;
  const { user, project } = await requireProjectPageAccess(slug, {
    navItemId: "blogs",
    feature: "blogs",
  });

  const adapter = getAdapter(project.id as ProjectId);
  if (!adapter.listBlogs) {
    redirect(getProjectFallbackHref(project.id, user.userType, user.navPermissions));
  }

  let blogs: UnifiedBlog[] = [];
  let error: string | null = null;

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
      canCreate={canCreate}
    />
  );
}
