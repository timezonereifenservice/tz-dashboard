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

export function blogSlugHint(slug: string) {
  const trimmed = slug.trim();
  if (!trimmed) {
    return "Leave empty to auto-generate from title on save.";
  }
  if (isValidBlogSlug(trimmed)) {
    return `Public URL: /blog/${trimmed}`;
  }
  return "Use lowercase letters, numbers, and hyphens only (e.g. cold-chain-best-practices).";
}
