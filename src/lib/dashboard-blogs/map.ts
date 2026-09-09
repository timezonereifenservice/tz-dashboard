import type {
  BlogImageAsset,
  BlogStatus,
  DashboardBlog,
} from "@/lib/dashboard-blogs/types";

export type BlogRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: BlogStatus;
  seo_title: string | null;
  seo_description: string | null;
  category: string | null;
  date_label: string | null;
  body_html: string | null;
  cover_image_url: string | null;
  cover_image_asset_id: string | null;
  views_count: number | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogImageRow = {
  id: string;
  public_url: string;
  alt_text: string | null;
  created_at: string;
};

function toIso(value: string | Date | null | undefined) {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function mapBlogRow(row: BlogRow): DashboardBlog {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? "",
    status: row.status,
    seoTitle: row.seo_title ?? "",
    seoDescription: row.seo_description ?? "",
    category: row.category ?? "",
    dateLabel: row.date_label ?? "",
    bodyHtml: row.body_html ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    coverImageAssetId: row.cover_image_asset_id,
    viewsCount: row.views_count ?? 0,
    publishedAt: row.published_at,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapBlogImageRow(row: BlogImageRow): BlogImageAsset {
  return {
    id: row.id,
    publicUrl: row.public_url,
    altText: row.alt_text,
    createdAt: toIso(row.created_at),
  };
}
