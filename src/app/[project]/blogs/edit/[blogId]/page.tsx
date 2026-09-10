import { notFound, redirect } from "next/navigation";
import { BlogEditorPanel } from "@/components/blogs/take-bring/blog-editor-panel";
import { CreateNewBlogPanel } from "@/components/blogs/tz-transport/create-new-blog-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { supportsBlogCreation } from "@/lib/blogs/create";
import {
  canAccessProject,
  canManageProjectContent,
} from "@/lib/projects/access";
import {
  getProjectBySlug,
  projectHasFeature,
  type ProjectId,
} from "@/lib/projects/config";

type PageProps = { params: Promise<{ project: string; blogId: string }> };

export default async function EditBlogPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { project: slug, blogId } = await params;
  const project = getProjectBySlug(slug);
  if (!project || !projectHasFeature(project, "blogs")) notFound();
  if (!canAccessProject(user.userType, project.id as ProjectId)) notFound();
  if (
    !canManageProjectContent(user.userType) ||
    !supportsBlogCreation(project.id as ProjectId)
  ) {
    redirect(`/${project.id}/blogs`);
  }

  const backHref = `/${project.id}/blogs`;

  return (
    <div className="space-y-4">
      {project.id === "tz-transport" ? (
        <CreateNewBlogPanel backHref={backHref} blogId={blogId} />
      ) : project.id === "take-bring" ? (
        <BlogEditorPanel backHref={backHref} blogId={blogId} />
      ) : null}
    </div>
  );
}
