import crypto from "crypto";
import sharp from "sharp";
import { projectQuery } from "@/lib/db/pools";
import {
  ensureUniqueBlogSlug,
  formatBlogDateLabel,
  normalizeBlogSlug,
} from "@/lib/blogs/helpers";
import { prepareBlogImagePersistence } from "@/lib/blogs/persist-image";
import {
  mapBlogImageRow,
  mapBlogRow,
  type BlogImageRow,
  type BlogRow,
} from "@/lib/dashboard-blogs/map";
import type { BlogImageAsset, DashboardBlog } from "@/lib/dashboard-blogs/types";
import type { CreateBlogInput, UploadedBlogImage } from "@/lib/blogs/types";
import {
  getTakeBringSupabase,
  isTakeBringSupabaseConfigured,
} from "@/lib/supabase/take-bring";

const BLOG_RETURN =
  "id, title, slug, excerpt, status, seo_title, seo_description, category, date_label, body_html, cover_image_url, cover_image_asset_id, views_count, published_at, created_at, updated_at" as const;

async function uploadTakeBringBlogImagePg(input: {
  file: File;
  altText?: string | null;
}): Promise<UploadedBlogImage> {
  const arrayBuffer = await input.file.arrayBuffer();
  const inputBuffer = Buffer.from(arrayBuffer);
  const imageId = crypto.randomUUID();

  const transformed = await sharp(inputBuffer)
    .rotate()
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  const persistence = prepareBlogImagePersistence(
    "take-bring",
    transformed.data,
    imageId,
  );

  const { rows } = await projectQuery<{
    id: string;
    public_url: string;
    alt_text: string | null;
  }>(
    "take-bring",
    `INSERT INTO blog_image_assets
     (id, original_file_name, mime_type, storage_path, public_url, width, height, size_bytes, file_data, alt_text, uploaded_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL)
     RETURNING id, public_url, alt_text`,
    [
      imageId,
      input.file.name,
      "image/webp",
      persistence.storagePath,
      persistence.publicUrl,
      transformed.info.width ?? null,
      transformed.info.height ?? null,
      transformed.info.size,
      persistence.fileData,
      input.altText?.trim() || null,
    ],
  );

  const row = rows[0];
  if (!row) throw new Error("Unable to upload image.");

  return {
    id: row.id,
    publicUrl: row.public_url,
    altText: row.alt_text,
  };
}

export async function uploadTakeBringBlogImage(input: {
  file: File;
  altText?: string | null;
}): Promise<UploadedBlogImage> {
  if (!isTakeBringSupabaseConfigured()) {
    return uploadTakeBringBlogImagePg(input);
  }

  const pgImage = await uploadTakeBringBlogImagePg(input);
  return pgImage;
}

async function createTakeBringBlogSupabase(
  input: CreateBlogInput,
): Promise<DashboardBlog> {
  const supabase = getTakeBringSupabase();
  if (!supabase) throw new Error("Take & Bring database is not configured.");

  const baseSlug = normalizeBlogSlug(input.title, input.slug);
  const slug = await ensureUniqueBlogSlug("take-bring", baseSlug);
  const status = input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("blogs")
    .insert({
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt?.trim() || "",
      status,
      seo_title: input.seoTitle?.trim() || "",
      seo_description: input.seoDescription?.trim() || "",
      category: input.category?.trim() || "General",
      date_label: input.dateLabel?.trim() || formatBlogDateLabel(),
      body_html: input.bodyHtml,
      cover_image_url: input.coverImageUrl.trim(),
      cover_image_asset_id: input.coverImageAssetId,
      views_count: 0,
      author_id: null,
      published_at: status === "PUBLISHED" ? now : null,
    })
    .select(BLOG_RETURN)
    .single();

  if (error) throw new Error(error.message);
  return mapBlogRow(data as BlogRow);
}

async function createTakeBringBlogPg(
  input: CreateBlogInput,
): Promise<DashboardBlog> {
  const baseSlug = normalizeBlogSlug(input.title, input.slug);
  const slug = await ensureUniqueBlogSlug("take-bring", baseSlug);
  const status = input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const publishedAt = status === "PUBLISHED" ? new Date() : null;

  const { rows } = await projectQuery<BlogRow>(
    "take-bring",
    `INSERT INTO blogs
     (title, slug, excerpt, status, seo_title, seo_description, category, date_label, body_html, cover_image_url, cover_image_asset_id, views_count, author_id, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0, NULL, $12)
     RETURNING ${BLOG_RETURN}`,
    [
      input.title.trim(),
      slug,
      input.excerpt?.trim() || "",
      status,
      input.seoTitle?.trim() || "",
      input.seoDescription?.trim() || "",
      input.category?.trim() || "General",
      input.dateLabel?.trim() || formatBlogDateLabel(),
      input.bodyHtml,
      input.coverImageUrl.trim(),
      input.coverImageAssetId,
      publishedAt,
    ],
  );

  const row = rows[0];
  if (!row) throw new Error("Failed to create blog.");
  return mapBlogRow(row);
}

export async function listTakeBringBlogImages(): Promise<BlogImageAsset[]> {
  const { rows } = await projectQuery<BlogImageRow>(
    "take-bring",
    `SELECT id, public_url, alt_text, created_at
     FROM blog_image_assets
     ORDER BY created_at DESC`,
  );
  return rows.map(mapBlogImageRow);
}

export async function getTakeBringBlogImageFile(imageId: string) {
  const { rows } = await projectQuery<{
    file_data: Buffer | null;
    mime_type: string | null;
  }>(
    "take-bring",
    `SELECT file_data, mime_type FROM blog_image_assets WHERE id = $1`,
    [imageId],
  );
  const row = rows[0];
  if (!row?.file_data) return null;
  return {
    data: row.file_data,
    mimeType: row.mime_type ?? "image/webp",
  };
}

export async function createTakeBringBlog(
  input: CreateBlogInput,
): Promise<DashboardBlog> {
  if (!input.title.trim()) throw new Error("Blog title is required.");
  if (!input.bodyHtml.trim()) throw new Error("Blog body is required.");
  if (!input.coverImageAssetId.trim() || !input.coverImageUrl.trim()) {
    throw new Error("Cover image is required.");
  }

  if (isTakeBringSupabaseConfigured()) {
    return createTakeBringBlogSupabase(input);
  }
  return createTakeBringBlogPg(input);
}

async function getTakeBringBlogByIdSupabase(id: string): Promise<DashboardBlog | null> {
  const supabase = getTakeBringSupabase();
  if (!supabase) throw new Error("Take & Bring database is not configured.");

  const { data, error } = await supabase
    .from("blogs")
    .select(BLOG_RETURN)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapBlogRow(data as BlogRow);
}

async function getTakeBringBlogByIdPg(id: string): Promise<DashboardBlog | null> {
  const { rows } = await projectQuery<BlogRow>(
    "take-bring",
    `SELECT ${BLOG_RETURN} FROM blogs WHERE id = $1 LIMIT 1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  return mapBlogRow(row);
}

export async function getTakeBringBlogById(id: string): Promise<DashboardBlog | null> {
  if (isTakeBringSupabaseConfigured()) {
    return getTakeBringBlogByIdSupabase(id);
  }
  return getTakeBringBlogByIdPg(id);
}

async function updateTakeBringBlogSupabase(
  id: string,
  input: CreateBlogInput,
  existing: DashboardBlog,
): Promise<DashboardBlog> {
  const supabase = getTakeBringSupabase();
  if (!supabase) throw new Error("Take & Bring database is not configured.");

  const baseSlug = normalizeBlogSlug(input.title, input.slug);
  const slug = await ensureUniqueBlogSlug("take-bring", baseSlug, id);
  const status = input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const publishedAt =
    status === "PUBLISHED"
      ? existing.publishedAt ?? new Date().toISOString()
      : null;

  const { data, error } = await supabase
    .from("blogs")
    .update({
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt?.trim() || "",
      status,
      seo_title: input.seoTitle?.trim() || "",
      seo_description: input.seoDescription?.trim() || "",
      category: input.category?.trim() || "General",
      date_label: input.dateLabel?.trim() || formatBlogDateLabel(),
      body_html: input.bodyHtml,
      cover_image_url: input.coverImageUrl.trim(),
      cover_image_asset_id: input.coverImageAssetId,
      published_at: publishedAt,
    })
    .eq("id", id)
    .select(BLOG_RETURN)
    .single();

  if (error) throw new Error(error.message);
  return mapBlogRow(data as BlogRow);
}

async function updateTakeBringBlogPg(
  id: string,
  input: CreateBlogInput,
  existing: DashboardBlog,
): Promise<DashboardBlog> {
  const baseSlug = normalizeBlogSlug(input.title, input.slug);
  const slug = await ensureUniqueBlogSlug("take-bring", baseSlug, id);
  const status = input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const publishedAt =
    status === "PUBLISHED"
      ? existing.publishedAt
        ? new Date(existing.publishedAt)
        : new Date()
      : null;

  const { rows } = await projectQuery<BlogRow>(
    "take-bring",
    `UPDATE blogs
     SET title = $1,
         slug = $2,
         excerpt = $3,
         status = $4,
         seo_title = $5,
         seo_description = $6,
         category = $7,
         date_label = $8,
         body_html = $9,
         cover_image_url = $10,
         cover_image_asset_id = $11,
         published_at = $12,
         updated_at = NOW()
     WHERE id = $13
     RETURNING ${BLOG_RETURN}`,
    [
      input.title.trim(),
      slug,
      input.excerpt?.trim() || "",
      status,
      input.seoTitle?.trim() || "",
      input.seoDescription?.trim() || "",
      input.category?.trim() || "General",
      input.dateLabel?.trim() || formatBlogDateLabel(),
      input.bodyHtml,
      input.coverImageUrl.trim(),
      input.coverImageAssetId,
      publishedAt,
      id,
    ],
  );

  const row = rows[0];
  if (!row) throw new Error("Blog not found.");
  return mapBlogRow(row);
}

export async function updateTakeBringBlog(
  id: string,
  input: CreateBlogInput,
): Promise<DashboardBlog> {
  const existing = await getTakeBringBlogById(id);
  if (!existing) throw new Error("Blog not found.");
  if (!input.title.trim()) throw new Error("Blog title is required.");
  if (!input.bodyHtml.trim()) throw new Error("Blog body is required.");
  if (!input.coverImageAssetId?.trim() || !input.coverImageUrl.trim()) {
    throw new Error("Cover image is required.");
  }

  if (isTakeBringSupabaseConfigured()) {
    return updateTakeBringBlogSupabase(id, input, existing);
  }
  return updateTakeBringBlogPg(id, input, existing);
}
