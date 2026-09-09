import { NextRequest, NextResponse } from "next/server";
import { requireBlogWriter } from "@/lib/blogs/auth";
import {
  listTzTransportBlogImages,
  uploadTzTransportBlogImage,
} from "@/lib/blogs/tz-transport-create";

export async function GET() {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  try {
    const images = await listTzTransportBlogImages();
    return NextResponse.json({ images });
  } catch (error) {
    console.error("[api/admin/blog-images GET]", error);
    return NextResponse.json(
      { message: "Unable to load images." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireBlogWriter();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const altText = formData.get("altText")?.toString().trim() || null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Image file is required." },
        { status: 400 },
      );
    }

    const image = await uploadTzTransportBlogImage({
      file,
      uploadedByUserId: auth.user.id,
      altText,
    });

    return NextResponse.json({
      message: "Image uploaded.",
      image,
    });
  } catch (error) {
    console.error("[api/admin/blog-images POST]", error);
    return NextResponse.json(
      { message: "Unable to upload image." },
      { status: 500 },
    );
  }
}
