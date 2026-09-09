import { NextRequest, NextResponse } from "next/server";
import { uploadProjectBlogImage, supportsBlogCreation } from "@/lib/blogs/create";
import { getCurrentUser } from "@/lib/auth/session";
import {
  canAccessProject,
  canManageProjectContent,
} from "@/lib/projects/access";
import type { ProjectId } from "@/lib/projects/config";

type Params = { params: Promise<{ project: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { project } = await params;
  const projectId = project as ProjectId;

  if (!canAccessProject(user.userType, projectId)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (!canManageProjectContent(user.userType)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  if (!supportsBlogCreation(projectId)) {
    return NextResponse.json(
      { message: "Image upload is not supported for this project." },
      { status: 400 },
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const altText = formData.get("altText")?.toString() ?? null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Image file is required." },
        { status: 400 },
      );
    }

    const image = await uploadProjectBlogImage(projectId, {
      file,
      uploadedByUserId: user.id,
      altText,
    });

    return NextResponse.json({ message: "Image uploaded.", image }, { status: 201 });
  } catch (error) {
    console.error("[api/blog-images POST]", error);
    const message =
      error instanceof Error ? error.message : "Unable to upload image.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
