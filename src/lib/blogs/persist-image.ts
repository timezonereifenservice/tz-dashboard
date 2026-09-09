import crypto from "crypto";
import type { ProjectId } from "@/lib/projects/config";

export type BlogImagePersistenceResult = {
  storagePath: string;
  publicUrl: string;
  fileData: Buffer;
};

export function buildBlogImageFileName() {
  return `${Date.now()}-${crypto.randomUUID()}.webp`;
}

export function buildBlogImagePublicUrl(
  projectId: ProjectId,
  imageId: string,
): string {
  if (projectId === "tz-transport") {
    return `/api/blog-images/${imageId}/file`;
  }
  return `/api/images/${imageId}`;
}

export function prepareBlogImagePersistence(
  projectId: ProjectId,
  webpBuffer: Buffer,
  imageId: string,
): BlogImagePersistenceResult {
  return {
    storagePath: `database:blog_image_assets/${imageId}`,
    publicUrl: buildBlogImagePublicUrl(projectId, imageId),
    fileData: webpBuffer,
  };
}
