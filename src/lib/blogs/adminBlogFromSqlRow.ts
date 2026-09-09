export type BlogSqlRow = Record<string, unknown>;

export function adminBlogFromSqlRow(row: BlogSqlRow) {
  const coverRelId = row.cover_image_asset_rel_id as string | null | undefined;
  const coverRelUrl = row.cover_image_asset_rel_public_url as
    | string
    | null
    | undefined;

  return {
    id: row.id as string,
    title: row.title as string,
    slug: row.slug as string,
    excerpt: (row.excerpt as string | null | undefined) ?? null,
    status: row.status as "DRAFT" | "PUBLISHED",
    seoTitle: (row.seo_title as string | null | undefined) ?? null,
    seoDescription: (row.seo_description as string | null | undefined) ?? null,
    canonicalUrl: (row.canonical_url as string | null | undefined) ?? null,
    tagsJson: row.tags_json ?? null,
    layoutId: row.layout_id as string,
    authorId: row.author_id as string,
    coverImageAssetId:
      (row.cover_image_asset_id as string | null | undefined) ?? null,
    contentJson: row.content_json ?? null,
    viewsCount: Number(row.views_count ?? 0),
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    coverImageAsset:
      coverRelId && coverRelUrl ? { id: coverRelId, publicUrl: coverRelUrl } : null,
    imageUsages: row.image_usages,
  };
}
