import { redirect } from "next/navigation";
import { BlogEditorPanel } from "@/components/blogs/take-bring/blog-editor-panel";
import { CreateNewBlogPanel } from "@/components/blogs/tz-transport/create-new-blog-panel";
import { supportsBlogCreation } from "@/lib/blogs/create";
import { canManageProjectContent } from "@/lib/projects/access";
import { requireProjectPageAccess } from "@/lib/projects/require-page-access";

type PageProps = { params: Promise<{ project: string; blogId: string }> };

export default async function EditBlogPage({ params }: PageProps) {
  const { project: slug, blogId } = await params;
  const { user, project } = await requireProjectPageAccess(slug, {
    navItemId: "blogs",
    feature: "blogs",
  });

  if (
    !canManageProjectContent(user.userType) ||
    !supportsBlogCreation(project.id)
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
