/**
 * End-to-end against Take & Bring blog create + EN sync:
 * create cover image → German blog → verify blog_translations → delete.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-take-bring-blog-en-translation.ts
 */
import crypto from "crypto";
import sharp from "sharp";
import { projectQuery } from "../src/lib/db/pools";
import { prepareBlogImagePersistence } from "../src/lib/blogs/persist-image";
import {
  createTakeBringBlog,
  deleteTakeBringBlog,
} from "../src/lib/blogs/take-bring-create";

async function ensureTestCoverImage(): Promise<{
  id: string;
  publicUrl: string;
  created: boolean;
}> {
  const existing = await projectQuery<{ id: string; public_url: string }>(
    "take-bring",
    `SELECT id, public_url FROM blog_image_assets ORDER BY created_at DESC LIMIT 1`,
  );
  if (existing.rows[0]) {
    return {
      id: existing.rows[0].id,
      publicUrl: existing.rows[0].public_url,
      created: false,
    };
  }

  const imageId = crypto.randomUUID();
  const webp = await sharp({
    create: {
      width: 64,
      height: 64,
      channels: 3,
      background: { r: 171, g: 198, b: 41 },
    },
  })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });

  const persistence = prepareBlogImagePersistence(
    "take-bring",
    webp.data,
    imageId,
  );

  await projectQuery(
    "take-bring",
    `INSERT INTO blog_image_assets
     (id, original_file_name, mime_type, storage_path, public_url, width, height, size_bytes, file_data, alt_text, uploaded_by_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NULL)`,
    [
      imageId,
      "test-en-sync-cover.webp",
      "image/webp",
      persistence.storagePath,
      persistence.publicUrl,
      webp.info.width ?? 64,
      webp.info.height ?? 64,
      webp.info.size,
      persistence.fileData,
      "Test cover for EN sync",
    ],
  );

  return { id: imageId, publicUrl: persistence.publicUrl, created: true };
}

async function main() {
  const stamp = Date.now();
  let blogId: string | null = null;
  let cleanupImageId: string | null = null;

  try {
    console.log("0) Ensuring cover image…");
    const image = await ensureTestCoverImage();
    if (image.created) cleanupImageId = image.id;
    console.log("   Cover:", { id: image.id, created: image.created });

    const deTitle = `Test Blog Take Bring EN Sync ${stamp}`;
    const deSlug = `test-tb-en-sync-${stamp}`;

    console.log("1) Creating German blog via createTakeBringBlog…");
    const blog = await createTakeBringBlog({
      title: deTitle,
      slug: deSlug,
      excerpt: "Dies ist ein kurzer Testauszug für die englische Übersetzung.",
      status: "DRAFT",
      seoTitle: "Test SEO Titel für Übersetzung",
      seoDescription: "Test SEO Beschreibung für die automatische Übersetzung.",
      category: "Logistik",
      dateLabel: "09 Oct 2026",
      bodyHtml:
        "<p>Dies ist ein deutscher Testbeitrag. Er prüft die automatische Übersetzung ins Englische.</p>",
      coverImageAssetId: image.id,
      coverImageUrl: image.publicUrl,
    });
    blogId = blog.id;
    console.log("   Created:", { id: blog.id, slug: blog.slug, title: blog.title });

    console.log("2) Verifying EN row in blog_translations…");
    const en = await projectQuery<{
      slug: string;
      title: string;
      excerpt: string | null;
      category: string | null;
      translation_status: string;
      body_html: string;
    }>(
      "take-bring",
      `SELECT slug, title, excerpt, category, translation_status, body_html
       FROM blog_translations WHERE blog_id::text = $1 AND locale = 'en' LIMIT 1`,
      [blogId],
    );

    if (!en.rows[0]) {
      throw new Error("No EN translation row — sync failed or was skipped incorrectly");
    }

    console.log("   EN translation:");
    console.log(
      JSON.stringify(
        {
          slug: en.rows[0].slug,
          title: en.rows[0].title,
          excerpt: en.rows[0].excerpt,
          category: en.rows[0].category,
          translation_status: en.rows[0].translation_status,
          bodyPreview: en.rows[0].body_html.slice(0, 120),
        },
        null,
        2,
      ),
    );

    const excerptLooksTranslated =
      Boolean(en.rows[0].excerpt) &&
      !/Dies ist ein kurzer Testauszug/i.test(en.rows[0].excerpt ?? "");
    const bodyLooksTranslated = !/Dies ist ein deutscher Testbeitrag/i.test(
      en.rows[0].body_html,
    );
    if (!excerptLooksTranslated || !bodyLooksTranslated) {
      throw new Error("EN excerpt/body still looks German — translation did not apply");
    }
    console.log("   EN excerpt/body differ from German — OK.");

    console.log("3) Deleting test blog…");
    const deleted = await deleteTakeBringBlog(blogId);
    if (!deleted) throw new Error("Delete returned false");

    const leftover = await projectQuery(
      "take-bring",
      `SELECT id::text AS id FROM blogs WHERE id::text = $1
       UNION ALL
       SELECT blog_id::text AS id FROM blog_translations WHERE blog_id::text = $1`,
      [blogId],
    );
    if (leftover.rows.length) throw new Error("Cleanup incomplete");
    blogId = null;
    console.log("   Deleted (CASCADE cleared EN row).");

    if (cleanupImageId) {
      await projectQuery(
        "take-bring",
        `DELETE FROM blog_image_assets WHERE id::text = $1`,
        [cleanupImageId],
      );
      cleanupImageId = null;
      console.log("   Deleted temporary cover image.");
    }

    console.log("\nPASS");
  } catch (error) {
    console.error("\nFAIL:", error);
    if (blogId) {
      console.error("Attempting blog cleanup…", blogId);
      try {
        await deleteTakeBringBlog(blogId);
      } catch (cleanupError) {
        console.error("Blog cleanup failed:", cleanupError);
      }
    }
    if (cleanupImageId) {
      try {
        await projectQuery(
          "take-bring",
          `DELETE FROM blog_image_assets WHERE id::text = $1`,
          [cleanupImageId],
        );
      } catch (cleanupError) {
        console.error("Image cleanup failed:", cleanupError);
      }
    }
    process.exitCode = 1;
  } finally {
    process.exit(process.exitCode ?? 0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
