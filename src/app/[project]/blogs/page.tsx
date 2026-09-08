import { notFound } from "next/navigation";
import { PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";
import { getAdapter } from "@/lib/adapters/registry";
import type { UnifiedBlog, UnifiedLead } from "@/lib/adapters/types";
import { getProjectBySlug, projectHasFeature, type ProjectId } from "@/lib/projects/config";

type PageProps = { params: Promise<{ project: string }> };

export default async function BlogsPage({ params }: PageProps) {
  const { project: slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project || !projectHasFeature(project, "blogs")) notFound();

  const adapter = getAdapter(project.id as ProjectId);
  if (!adapter.listBlogs) notFound();

  let blogs: UnifiedBlog[] = [];
  try {
    blogs = await adapter.listBlogs();
  } catch {
    blogs = [];
  }

  return (
    <div>
      <PageHeader
        title="Blogs"
        description={`${blogs.length} posts in ${project.name}`}
      />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    No blog posts found
                  </td>
                </tr>
              ) : (
                blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-black">
                      {blog.title}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{blog.slug}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={blog.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(blog.updatedAt)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {blog.viewCount ?? 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-neutral-500">
        Full blog editing remains in each project&apos;s native dashboard. This view is read-only.
      </p>
    </div>
  );
}
