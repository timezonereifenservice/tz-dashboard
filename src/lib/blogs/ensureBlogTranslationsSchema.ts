import { projectQuery } from "@/lib/db/pools";

export type BlogTranslationProjectId = "tz-transport" | "take-bring";

const ensured = new Set<BlogTranslationProjectId>();

/** Postgres type for blogs.id — FK on blog_translations.blog_id must match. */
const BLOG_ID_SQL_TYPE: Record<BlogTranslationProjectId, "TEXT" | "UUID"> = {
  "tz-transport": "TEXT",
  "take-bring": "UUID",
};

/** Idempotent — safe on serverless cold starts if SQL migration was not run yet. */
export async function ensureBlogTranslationsSchema(
  projectId: BlogTranslationProjectId = "tz-transport",
): Promise<void> {
  if (ensured.has(projectId)) return;

  const blogIdType = BLOG_ID_SQL_TYPE[projectId];

  await projectQuery(
    projectId,
    `
    CREATE TABLE IF NOT EXISTS blog_translations (
      id TEXT PRIMARY KEY,
      blog_id ${blogIdType} NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
      locale VARCHAR(5) NOT NULL CHECK (locale IN ('en')),
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      seo_title TEXT,
      seo_description TEXT,
      category TEXT,
      body_html TEXT NOT NULL DEFAULT '',
      source_hash TEXT,
      translation_status TEXT NOT NULL DEFAULT 'auto',
      translated_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (blog_id, locale),
      UNIQUE (slug)
    )
  `,
  );
  await projectQuery(
    projectId,
    `CREATE INDEX IF NOT EXISTS blog_translations_blog_id_idx ON blog_translations (blog_id)`,
  );
  await projectQuery(
    projectId,
    `CREATE INDEX IF NOT EXISTS blog_translations_locale_slug_idx ON blog_translations (locale, slug)`,
  );
  ensured.add(projectId);
}
