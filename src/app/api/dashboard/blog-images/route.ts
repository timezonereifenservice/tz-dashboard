import { NextResponse } from "next/server";
import { requireBlogWriter } from "@/lib/blogs/auth";
import {
  listTakeBringBlogImages,
  uploadTakeBringBlogImage,
} from "@/lib/blogs/take-bring-create";

export async function GET() {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  try {
    const images = await listTakeBringBlogImages();
    return NextResponse.json({ ok: true, images });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not list images.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const altText = formData.get("altText")?.toString() ?? null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Image file is required." },
        { status: 400 },
      );
    }

    const image = await uploadTakeBringBlogImage({ file, altText });
    return NextResponse.json({ ok: true, image }, { status: 201 });
  } catch (error) {
    console.error("[api/dashboard/blog-images POST]", error);
    const message =
      error instanceof Error ? error.message : "Could not upload image.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
