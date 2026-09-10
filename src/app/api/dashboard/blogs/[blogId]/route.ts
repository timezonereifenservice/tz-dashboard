import { NextResponse } from "next/server";
import { requireBlogWriter } from "@/lib/blogs/auth";
import {
  getTakeBringBlogById,
  updateTakeBringBlog,
} from "@/lib/blogs/take-bring-create";
import type { BlogEditorInput } from "@/lib/dashboard-blogs/types";

type RouteContext = {
  params: Promise<{ blogId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const { blogId } = await context.params;
  try {
    const blog = await getTakeBringBlogById(blogId);
    if (!blog) {
      return NextResponse.json(
        { ok: false, error: "Blog not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, blog });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load blog.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const { blogId } = await context.params;
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
    const blog = await updateTakeBringBlog(blogId, {
      title: typeof body.title === "string" ? body.title : "",
      slug: typeof body.slug === "string" ? body.slug : "",
      excerpt: typeof body.excerpt === "string" ? body.excerpt : "",
      status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      seoTitle: typeof body.seoTitle === "string" ? body.seoTitle : "",
      seoDescription:
        typeof body.seoDescription === "string" ? body.seoDescription : "",
      category: typeof body.category === "string" ? body.category : "",
      dateLabel: typeof body.dateLabel === "string" ? body.dateLabel : "",
      bodyHtml: typeof body.bodyHtml === "string" ? body.bodyHtml : "",
      coverImageUrl:
        typeof body.coverImageUrl === "string" ? body.coverImageUrl : "",
      coverImageAssetId:
        typeof body.coverImageAssetId === "string" ? body.coverImageAssetId : "",
    });
    return NextResponse.json({ ok: true, blog });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update blog.";
    const status = /not found/i.test(message)
      ? 404
      : /required|slug/i.test(message)
        ? 400
        : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
