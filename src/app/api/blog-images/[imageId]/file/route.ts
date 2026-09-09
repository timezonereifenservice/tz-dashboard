import { NextRequest, NextResponse } from "next/server";
import { getTzTransportBlogImageFile } from "@/lib/blogs/tz-transport-create";

type Params = { params: Promise<{ imageId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { imageId } = await params;
  if (!imageId) {
    return NextResponse.json({ message: "Image id is required." }, { status: 400 });
  }

  try {
    const image = await getTzTransportBlogImageFile(imageId);
    if (!image) {
      return NextResponse.json({ message: "Image not found." }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.data), {
      status: 200,
      headers: {
        "Content-Type": image.mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[api/blog-images/file GET]", error);
    return NextResponse.json({ message: "Unable to load image." }, { status: 500 });
  }
}
