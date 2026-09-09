import { NextRequest, NextResponse } from "next/server";
import slugify from "slugify";
import { requireBlogWriter } from "@/lib/blogs/auth";
import { createTzTransportBlogRecord } from "@/lib/blogs/tz-transport-create";
import { projectQuery } from "@/lib/db/pools";

type CreateBlogBody = {
  title?: string;
  slug?: string;
  excerpt?: string;
  status?: "DRAFT" | "PUBLISHED";
  seoTitle?: string;
  seoDescription?: string;
  contentJson?: unknown;
  selectedImageIds?: string[];
  coverImageAssetId?: string | null;
};

export async function POST(req: NextRequest) {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  try {
    const body = (await req.json()) as CreateBlogBody;
    const title = body.title?.trim();
    const selectedImageIds = Array.from(new Set(body.selectedImageIds ?? [])).slice(
      0,
      1,
    );

    if (!title) {
      return NextResponse.json({ message: "title is required." }, { status: 400 });
    }
    if (!selectedImageIds.length) {
      return NextResponse.json(
        { message: "One image is required for blog." },
        { status: 400 },
      );
    }

    const coverImageAssetId =
      body.coverImageAssetId && selectedImageIds.includes(body.coverImageAssetId)
        ? body.coverImageAssetId
        : selectedImageIds[0];

    const { rows: imageRows } = await projectQuery<{ public_url: string }>(
      "tz-transport",
      `SELECT public_url FROM blog_image_assets WHERE id = $1 LIMIT 1`,
      [coverImageAssetId],
    );
    const coverImageUrl = imageRows[0]?.public_url;
    if (!coverImageUrl) {
      return NextResponse.json({ message: "Cover image not found." }, { status: 400 });
    }

    const contentJson =
      body.contentJson && typeof body.contentJson === "object"
        ? (body.contentJson as Record<string, unknown>)
        : {};

    const blog = await createTzTransportBlogRecord(
      {
        title,
        slug:
          body.slug?.trim() ||
          slugify(title, { lower: true, strict: true }) ||
          undefined,
        excerpt: body.excerpt,
        status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        category:
          typeof contentJson.category === "string" ? contentJson.category : "",
        dateLabel: typeof contentJson.date === "string" ? contentJson.date : "",
        bodyHtml:
          typeof contentJson.bodyHtml === "string" ? contentJson.bodyHtml : "",
        coverImageAssetId,
        coverImageUrl,
      },
      auth.user.id,
    );

    return NextResponse.json({ message: "Blog created.", blog });
  } catch (error) {
    console.error("[api/admin/blogs POST]", error);
    return NextResponse.json({ message: "Unable to create blog." }, { status: 500 });
  }
}
