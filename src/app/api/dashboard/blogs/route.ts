import { NextRequest, NextResponse } from "next/server";
import { assertSameOrigin } from "@/lib/auth/request-guard";
import { requireBlogWriter } from "@/lib/blogs/auth";
import { createTakeBringBlog } from "@/lib/blogs/take-bring-create";
import type { BlogEditorInput } from "@/lib/dashboard-blogs/types";

export async function POST(request: NextRequest) {
  const originError = assertSameOrigin(request);
  if (originError) return originError;

  const auth = await requireBlogWriter("take-bring");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  let body: Partial<BlogEditorInput>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 },
    );
  }

  try {
    const blog = await createTakeBringBlog({
      title: typeof body.title === "string" ? body.title : "",
      slug: typeof body.slug === "string" ? body.slug : "",
      excerpt: typeof body.excerpt === "string" ? body.excerpt : "",
      status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : "",
      seoDescription:
        typeof body.seoDescription === "string" ? body.seoDescription : "",
      category: typeof body.category === "string" ? body.category : "",
      dateLabel: typeof body.dateLabel === "string" ? body.dateLabel : undefined,
      bodyHtml: typeof body.bodyHtml === "string" ? body.bodyHtml : "",
      coverImageUrl:
        typeof body.coverImageUrl === "string" ? body.coverImageUrl : "",
      coverImageAssetId:
        typeof body.coverImageAssetId === "string" ? body.coverImageAssetId : "",
    });
    return NextResponse.json({ ok: true, blog }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not create blog.";
    const status = /required|slug/i.test(message) ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
