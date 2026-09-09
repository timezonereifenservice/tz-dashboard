import { NextRequest, NextResponse } from "next/server";
import { getTakeBringBlogImageFile } from "@/lib/blogs/take-bring-create";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Image id is required." },
      { status: 400 },
    );
  }

  try {
    const image = await getTakeBringBlogImageFile(id);
    if (!image) {
      return NextResponse.json(
        { ok: false, error: "Image not found." },
        { status: 404 },
      );
    }

    return new NextResponse(new Uint8Array(image.data), {
      status: 200,
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[api/images GET]", error);
    return NextResponse.json(
      { ok: false, error: "Could not load image." },
      { status: 500 },
    );
  }
}
