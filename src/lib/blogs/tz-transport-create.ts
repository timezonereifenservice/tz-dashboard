import crypto from "crypto";
import sharp from "sharp";
import { projectQuery } from "@/lib/db/pools";
import { withProjectTransaction } from "@/lib/db/transaction";
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

type BlogRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  published_at: string | null;
  updated_at: string;
};

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

export async function uploadTzTransportBlogImage(input: {
  file: File;
  uploadedByUserId: string;
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
    "tz-transport",
    transformed.data,
    imageId,
  );

  const { rows } = await projectQuery<{
    id: string;
    public_url: string;
    alt_text: string | null;
  }>(
    "tz-transport",
    `INSERT INTO blog_image_assets
     (id, original_file_name, mime_type, storage_path, public_url, width, height, size_bytes, alt_text, uploaded_by_user_id, file_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      input.altText?.trim() || null,
      input.uploadedByUserId,
      persistence.fileData,
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

export async function createTzTransportBlog(
  input: CreateBlogInput,
  authorId: string,
): Promise<CreatedBlog> {
  if (!input.title.trim()) throw new Error("Blog title is required.");
  if (!input.bodyHtml.trim()) throw new Error("Blog body is required.");
  if (!input.coverImageAssetId.trim()) throw new Error("Cover image is required.");

  const baseSlug = normalizeBlogSlug(input.title, input.slug);
  const slug = await ensureUniqueBlogSlug("tz-transport", baseSlug);
  const status = input.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const publishedAt = status === "PUBLISHED" ? new Date() : null;
  const dateLabel = formatBlogDateLabel();
  const contentJson = {
    category: input.category?.trim() || "General",
    date: dateLabel,
    bodyHtml: input.bodyHtml,
  };
  const blogId = crypto.randomUUID();

  const row = await withProjectTransaction("tz-transport", async (query) => {
    let layoutResult = await query(
      `SELECT id FROM blog_layouts WHERE slug = 'default-blog-layout' LIMIT 1`,
    );

    if (!layoutResult.rows[0]) {
      const newLayoutId = crypto.randomUUID();
      layoutResult = await query(
        `INSERT INTO blog_layouts
         (id, name, slug, description, idea_hint, ai_prompt_template, layout_markup, editor_slots_json, seo_notes, created_by_user_id, is_active, created_at, updated_at)
         VALUES
         ($1, 'Default Blog Layout', 'default-blog-layout', 'Default fallback layout aligned with frontend blog UI.', NULL, 'Default internal layout.', '<article><section><h1>{{title}}</h1><p>{{body}}</p></section></article>', '[]'::json, 'Default fallback layout.', $2, TRUE, NOW(), NOW())
         RETURNING id`,
        [newLayoutId, authorId],
      );
    }

    const inserted = await query(
      `INSERT INTO blogs
       (id, title, slug, excerpt, status, layout_id, author_id, cover_image_asset_id, seo_title, seo_description, content_json, published_at, views_count, created_at, updated_at)
       VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0, NOW(), NOW())
       RETURNING id, title, slug, status, published_at, updated_at`,
      [
        blogId,
        input.title.trim(),
        slug,
        input.excerpt?.trim() || null,
        status,
        layoutResult.rows[0]!.id,
        authorId,
        input.coverImageAssetId,
        input.seoTitle?.trim() || null,
        input.seoDescription?.trim() || null,
        contentJson,
        publishedAt,
      ],
    );

    await query(
      `INSERT INTO blog_image_usages (id, blog_id, image_asset_id, sort_order, is_cover, created_at)
       VALUES ($1, $2, $3, 0, TRUE, NOW())`,
      [crypto.randomUUID(), blogId, input.coverImageAssetId],
    );

    const blog = inserted.rows[0] as BlogRow | undefined;
    if (!blog) throw new Error("Failed to create blog.");
    return blog;
  });

  return mapCreatedBlog(row);
}
