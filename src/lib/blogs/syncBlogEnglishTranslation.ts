import crypto from "crypto";
import slugify from "slugify";
import { projectQuery } from "@/lib/db/pools";
import { translateDeToEn } from "@/lib/blogs/blogTranslate";
import {
  ensureBlogTranslationsSchema,
  type BlogTranslationProjectId,
} from "@/lib/blogs/ensureBlogTranslationsSchema";

export type GermanBlogSource = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: string;
  bodyHtml: string;
};

function hashGermanSource(source: Omit<GermanBlogSource, "id" | "slug">): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        title: source.title,
        excerpt: source.excerpt ?? "",
        seoTitle: source.seoTitle ?? "",
        seoDescription: source.seoDescription ?? "",
        category: source.category,
        bodyHtml: source.bodyHtml,
      }),
    )
    .digest("hex");
}

async function isEnSlugTaken(
  projectId: BlogTranslationProjectId,
  slug: string,
  blogId: string,
): Promise<boolean> {
  const inBlogs = await projectQuery<{ id: string }>(
    projectId,
    `SELECT id FROM blogs WHERE slug = $1 AND id::text <> $2 LIMIT 1`,
    [slug, blogId],
  );
  if (inBlogs.rows[0]) return true;

  const inTranslations = await projectQuery<{ blog_id: string }>(
    projectId,
    `SELECT blog_id FROM blog_translations WHERE slug = $1 AND blog_id::text <> $2 LIMIT 1`,
    [slug, blogId],
  );
  return Boolean(inTranslations.rows[0]);
}

async function allocateUniqueEnSlug(
  projectId: BlogTranslationProjectId,
  englishTitle: string,
  blogId: string,
): Promise<string> {
  const base =
    slugify(englishTitle, { lower: true, strict: true, locale: "en" }) ||
    "blog-post";
  let candidate = base;
  let suffix = 1;
  while (await isEnSlugTaken(projectId, candidate, blogId)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export type SyncEnglishResult =
  | { status: "skipped"; reason: "unchanged" }
  | { status: "ok"; enSlug: string }
  | { status: "failed"; error: string };

export async function syncBlogEnglishTranslation(
  source: GermanBlogSource,
  options?: { force?: boolean; projectId?: BlogTranslationProjectId },
): Promise<SyncEnglishResult> {
  const projectId = options?.projectId ?? "tz-transport";
  await ensureBlogTranslationsSchema(projectId);

  const sourceHash = hashGermanSource(source);
  const existing = await projectQuery<{
    source_hash: string | null;
    slug: string;
  }>(
    projectId,
    `SELECT source_hash, slug FROM blog_translations WHERE blog_id::text = $1 AND locale = 'en' LIMIT 1`,
    [source.id],
  );
  const row = existing.rows[0];
  if (!options?.force && row?.source_hash === sourceHash) {
    return { status: "skipped", reason: "unchanged" };
  }

  try {
    const title = await translateDeToEn(source.title);
    const excerpt = source.excerpt?.trim()
      ? await translateDeToEn(source.excerpt)
      : null;
    const seoTitle = source.seoTitle?.trim()
      ? await translateDeToEn(source.seoTitle)
      : null;
    const seoDescription = source.seoDescription?.trim()
      ? await translateDeToEn(source.seoDescription)
      : null;
    const category = source.category?.trim()
      ? await translateDeToEn(source.category)
      : "Logistics";
    const bodyHtml = source.bodyHtml?.trim()
      ? await translateDeToEn(source.bodyHtml)
      : `<p>${excerpt ?? ""}</p>`;

    // Keep stable EN slug when re-translating the same post.
    const enSlug = row?.slug?.trim()
      ? row.slug
      : await allocateUniqueEnSlug(projectId, title, source.id);
    const translationId = crypto.randomUUID();

    await projectQuery(
      projectId,
      `INSERT INTO blog_translations
        (id, blog_id, locale, slug, title, excerpt, seo_title, seo_description, category, body_html, source_hash, translation_status, translated_at, created_at, updated_at)
       VALUES
        ($1, $2, 'en', $3, $4, $5, $6, $7, $8, $9, $10, 'auto', NOW(), NOW(), NOW())
       ON CONFLICT (blog_id, locale) DO UPDATE SET
         slug = EXCLUDED.slug,
         title = EXCLUDED.title,
         excerpt = EXCLUDED.excerpt,
         seo_title = EXCLUDED.seo_title,
         seo_description = EXCLUDED.seo_description,
         category = EXCLUDED.category,
         body_html = EXCLUDED.body_html,
         source_hash = EXCLUDED.source_hash,
         translation_status = 'auto',
         translated_at = NOW(),
         updated_at = NOW()`,
      [
        translationId,
        source.id,
        enSlug,
        title,
        excerpt,
        seoTitle,
        seoDescription,
        category,
        bodyHtml,
        sourceHash,
      ],
    );

    return { status: "ok", enSlug };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed";
    console.error("[syncBlogEnglishTranslation]", {
      projectId,
      blogId: source.id,
      error,
    });
    return { status: "failed", error: message };
  }
}

export function germanBlogSourceFromRow(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  content_json?: unknown;
  category?: string | null;
  body_html?: string | null;
}): GermanBlogSource {
  const content =
    row.content_json && typeof row.content_json === "object"
      ? (row.content_json as Record<string, unknown>)
      : {};
  const categoryFromJson =
    typeof content.category === "string" && content.category.trim()
      ? content.category.trim()
      : null;
  const bodyFromJson =
    typeof content.bodyHtml === "string" && content.bodyHtml.trim()
      ? content.bodyHtml
      : null;

  const category =
    categoryFromJson ||
    (typeof row.category === "string" && row.category.trim()
      ? row.category.trim()
      : "Logistics");
  const bodyHtml =
    bodyFromJson ||
    (typeof row.body_html === "string" && row.body_html.trim()
      ? row.body_html
      : `<p>${row.excerpt ?? ""}</p>`);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    category,
    bodyHtml,
  };
}

export async function syncEnglishForBlogId(
  blogId: string,
  options?: { force?: boolean; projectId?: BlogTranslationProjectId },
): Promise<SyncEnglishResult> {
  const projectId = options?.projectId ?? "tz-transport";

  if (projectId === "take-bring") {
    const result = await projectQuery<{
      id: string;
      slug: string;
      title: string;
      excerpt: string | null;
      seo_title: string | null;
      seo_description: string | null;
      category: string | null;
      body_html: string | null;
    }>(
      projectId,
      `SELECT id, slug, title, excerpt, seo_title, seo_description, category, body_html
       FROM blogs WHERE id::text = $1 LIMIT 1`,
      [blogId],
    );
    const row = result.rows[0];
    if (!row) {
      return { status: "failed", error: "Blog not found" };
    }
    return syncBlogEnglishTranslation(germanBlogSourceFromRow(row), {
      ...options,
      projectId,
    });
  }

  const result = await projectQuery<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    seo_title: string | null;
    seo_description: string | null;
    content_json: unknown;
  }>(
    projectId,
    `SELECT id, slug, title, excerpt, seo_title, seo_description, content_json
     FROM blogs WHERE id = $1 LIMIT 1`,
    [blogId],
  );
  const row = result.rows[0];
  if (!row) {
    return { status: "failed", error: "Blog not found" };
  }
  return syncBlogEnglishTranslation(germanBlogSourceFromRow(row), {
    ...options,
    projectId,
  });
}

/** Best-effort DE→EN sync after German create/update. Never throws. */
export async function syncEnglishTranslationBestEffort(
  blog: {
    id: string;
    slug: string;
    title: string;
    excerpt?: string | null;
    seoTitle?: string | null;
    seoDescription?: string | null;
    contentJson?: unknown;
    category?: string | null;
    bodyHtml?: string | null;
  },
  options?: { projectId?: BlogTranslationProjectId },
): Promise<SyncEnglishResult | null> {
  const projectId = options?.projectId ?? "tz-transport";
  try {
    const source = germanBlogSourceFromRow({
      id: blog.id,
      slug: blog.slug,
      title: blog.title,
      excerpt: blog.excerpt ?? null,
      seo_title: blog.seoTitle ?? null,
      seo_description: blog.seoDescription ?? null,
      content_json: blog.contentJson ?? null,
      category: blog.category ?? null,
      body_html: blog.bodyHtml ?? null,
    });
    const result = await syncBlogEnglishTranslation(source, { projectId });
    if (result.status === "failed") {
      console.error("[syncEnglishTranslationBestEffort]", {
        projectId,
        blogId: blog.id,
        error: result.error,
      });
    }
    return result;
  } catch (error) {
    console.error("[syncEnglishTranslationBestEffort]", {
      projectId,
      blogId: blog.id,
      error,
    });
    return null;
  }
}
