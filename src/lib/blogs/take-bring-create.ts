import crypto from "crypto";
import sharp from "sharp";
import { projectQuery } from "@/lib/db/pools";
import {
  ensureUniqueBlogSlug,
  formatBlogDateLabel,
  normalizeBlogSlug,
} from "@/lib/blogs/helpers";
import { prepareBlogImagePersistence } from "@/lib/blogs/persist-image";
import type {
  CreateBlogInput,
  CreatedBlog,
  UploadedBlogImage,
} from "@/lib/blogs/types";
import {
  getTakeBringSupabase,
  isTakeBringSupabaseConfigured,
} from "@/lib/supabase/take-bring";

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  updated_at: string;
};

const BLOG_RETURN =
  "id, title, slug, status, published_at, updated_at" as const;

function mapCreatedBlog(row: BlogRow): CreatedBlog {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

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
): Promise<CreatedBlog> {
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
      date_label: formatBlogDateLabel(),
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
  return mapCreatedBlog(data as BlogRow);
}

async function createTakeBringBlogPg(
  input: CreateBlogInput,
): Promise<CreatedBlog> {
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
      formatBlogDateLabel(),
      input.bodyHtml,
      input.coverImageUrl.trim(),
      input.coverImageAssetId,
      publishedAt,
    ],
  );

  const row = rows[0];
  if (!row) throw new Error("Failed to create blog.");
  return mapCreatedBlog(row);
}

export async function createTakeBringBlog(
  input: CreateBlogInput,
): Promise<CreatedBlog> {
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
