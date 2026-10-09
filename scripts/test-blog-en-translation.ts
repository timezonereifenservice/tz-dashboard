/**
 * End-to-end against real TZ-Dashboard blog create + EN sync:
 * create German blog → verify blog_translations → delete.
 *
 * Run: npx tsx --env-file=.env.local scripts/test-blog-en-translation.ts
 */
import { projectQuery } from "../src/lib/db/pools";
import {
  createTzTransportBlogRecord,
  deleteTzTransportBlog,
} from "../src/lib/blogs/tz-transport-create";

async function main() {
  const stamp = Date.now();
  let blogId: string | null = null;

  try {
    const author = await projectQuery<{ id: string }>(
      "tz-transport",
      `SELECT id FROM users WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1`,
    );
    if (!author.rows[0]) throw new Error("No active user for author_id");

    const image = await projectQuery<{ id: string; public_url: string }>(
      "tz-transport",
      `SELECT id, public_url FROM blog_image_assets ORDER BY created_at DESC LIMIT 1`,
    );
    if (!image.rows[0]) {
      throw new Error("No blog_image_assets — upload a cover image in the dashboard first");
    }

    const deTitle = `Test Blog EN Sync ${stamp}`;
    const deSlug = `test-blog-en-sync-${stamp}`;

    console.log("1) Creating German blog via createTzTransportBlogRecord…");
    const blog = await createTzTransportBlogRecord(
      {
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
        coverImageAssetId: image.rows[0].id,
        coverImageUrl: image.rows[0].public_url,
      },
      author.rows[0].id,
    );
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
      "tz-transport",
      `SELECT slug, title, excerpt, category, translation_status, body_html
       FROM blog_translations WHERE blog_id = $1 AND locale = 'en' LIMIT 1`,
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

    if (en.rows[0].title === deTitle) {
      console.warn("   Warning: EN title equals DE title — translate may have failed quietly.");
    } else {
      console.log("   EN title differs from German — OK.");
    }

    console.log("3) Deleting test blog…");
    const deleted = await deleteTzTransportBlog(blogId);
    if (!deleted) throw new Error("Delete returned false");

    const leftover = await projectQuery(
      "tz-transport",
      `SELECT id FROM blogs WHERE id = $1
       UNION ALL
       SELECT blog_id::text FROM blog_translations WHERE blog_id = $1`,
      [blogId],
    );
    if (leftover.rows.length) throw new Error("Cleanup incomplete");
    blogId = null;
    console.log("   Deleted (CASCADE cleared EN row).");
    console.log("\nPASS");
  } catch (error) {
    console.error("\nFAIL:", error);
    if (blogId) {
      console.error("Attempting cleanup…", blogId);
      try {
        await deleteTzTransportBlog(blogId);
      } catch (cleanupError) {
        console.error("Cleanup failed:", cleanupError);
      }
    }
    process.exitCode = 1;
  } finally {
    // Allow pool to drain so process can exit.
    process.exit(process.exitCode ?? 0);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
