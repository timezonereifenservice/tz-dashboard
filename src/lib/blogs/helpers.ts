import { projectQuery } from "@/lib/db/pools";
import type { ProjectId } from "@/lib/projects/config";

export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyBlogTitle(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidBlogSlug(slug: string) {
  const trimmed = slug.trim();
  if (!trimmed) return true;
  return BLOG_SLUG_PATTERN.test(trimmed);
}

export function formatBlogDateLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function ensureUniqueBlogSlug(
  projectId: ProjectId,
  baseSlug: string,
  excludeId?: string,
) {
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const { rows } = await projectQuery<{ id: string }>(
      projectId,
      excludeId
        ? `SELECT id FROM blogs WHERE slug = $1 AND id <> $2 LIMIT 1`
        : `SELECT id FROM blogs WHERE slug = $1 LIMIT 1`,
      excludeId ? [candidate, excludeId] : [candidate],
    );
    if (!rows[0]) return candidate;
    suffix += 1;
    candidate = `${baseSlug}-${suffix}`;
  }
}

export function normalizeBlogSlug(title: string, slug?: string) {
  const raw = slug?.trim() || slugifyBlogTitle(title);
  const candidate = raw || "blog-post";
  if (slug?.trim() && !isValidBlogSlug(candidate)) {
    throw new Error("Slug must use lowercase letters, numbers, and hyphens only.");
  }
  return candidate;
}
