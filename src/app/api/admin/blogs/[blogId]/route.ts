import { NextRequest, NextResponse } from "next/server";
import { requireBlogWriter } from "@/lib/blogs/auth";
import {
  getTzTransportBlogById,
  updateTzTransportBlogRecord,
  type UpdateTzTransportBlogInput,
} from "@/lib/blogs/tz-transport-create";

type RouteParams = {
  params: Promise<{ blogId: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { blogId } = await params;
  try {
    const blog = await getTzTransportBlogById(blogId);
    if (!blog) {
      return NextResponse.json({ message: "Blog not found." }, { status: 404 });
    }
    return NextResponse.json({ blog });
  } catch (error) {
    console.error("[api/admin/blogs/[blogId] GET]", error);
    return NextResponse.json({ message: "Unable to load blog." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const { blogId } = await params;
  try {
    const body = (await req.json()) as UpdateTzTransportBlogInput;
    const blog = await updateTzTransportBlogRecord(blogId, body);
    return NextResponse.json({ message: "Blog updated.", blog });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update blog.";
    const status = /not found|required|image/i.test(message) ? 400 : 500;
    console.error("[api/admin/blogs/[blogId] PUT]", error);
    return NextResponse.json({ message }, { status });
  }
}
