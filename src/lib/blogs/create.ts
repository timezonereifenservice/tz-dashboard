import { createTakeBringBlog, uploadTakeBringBlogImage } from "@/lib/blogs/take-bring-create";
import {
  createTzTransportBlog,
  uploadTzTransportBlogImage,
} from "@/lib/blogs/tz-transport-create";
import type {
  CreateBlogInput,
  CreatedBlog,
  UploadedBlogImage,
} from "@/lib/blogs/types";
import type { ProjectId } from "@/lib/projects/config";

const BLOG_PROJECTS = new Set<ProjectId>(["tz-transport", "take-bring"]);

export function supportsBlogCreation(projectId: ProjectId) {
  return BLOG_PROJECTS.has(projectId);
}

export async function uploadProjectBlogImage(
  projectId: ProjectId,
  input: {
    file: File;
    uploadedByUserId: string;
    altText?: string | null;
  },
): Promise<UploadedBlogImage> {
  if (projectId === "tz-transport") {
    return uploadTzTransportBlogImage(input);
  }
  if (projectId === "take-bring") {
    return uploadTakeBringBlogImage({
      file: input.file,
      altText: input.altText,
    });
  }
  throw new Error("Blog creation is not supported for this project.");
}

export async function createProjectBlog(
  projectId: ProjectId,
  input: CreateBlogInput,
  authorId: string,
): Promise<CreatedBlog> {
  if (projectId === "tz-transport") {
    return createTzTransportBlog(input, authorId);
  }
  if (projectId === "take-bring") {
    const blog = await createTakeBringBlog(input);
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      status: blog.status,
      publishedAt: blog.publishedAt ?? null,
      updatedAt: blog.updatedAt,
    };
  }
  throw new Error("Blog creation is not supported for this project.");
}
