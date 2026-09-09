import { NextRequest, NextResponse } from "next/server";
import { createProjectBlog, supportsBlogCreation } from "@/lib/blogs/create";
import type { BlogStatus } from "@/lib/blogs/types";
import { getCurrentUser } from "@/lib/auth/session";
import {
  canAccessProject,
  canManageProjectContent,
} from "@/lib/projects/access";
import type { ProjectId } from "@/lib/projects/config";

type Params = { params: Promise<{ project: string }> };

type CreateBody = {
  title?: string;
  slug?: string;
  excerpt?: string;
  status?: BlogStatus;
  seoTitle?: string;
  seoDescription?: string;
  category?: string;
  bodyHtml?: string;
  coverImageAssetId?: string;
  coverImageUrl?: string;
};

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
      { message: "Blog creation is not supported for this project." },
      { status: 400 },
    );
  }

  try {
    const body = (await req.json()) as CreateBody;
    const title = body.title?.trim();
    const bodyHtml = body.bodyHtml?.trim();
    const coverImageAssetId = body.coverImageAssetId?.trim();
    const coverImageUrl = body.coverImageUrl?.trim();

    if (!title || !bodyHtml || !coverImageAssetId || !coverImageUrl) {
      return NextResponse.json(
        {
          message:
            "Title, body, and cover image are required.",
        },
        { status: 400 },
      );
    }

    const blog = await createProjectBlog(
      projectId,
      {
        title,
        slug: body.slug,
        excerpt: body.excerpt,
        status: body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        seoTitle: body.seoTitle,
        seoDescription: body.seoDescription,
        category: body.category,
        bodyHtml,
        coverImageAssetId,
        coverImageUrl,
      },
      user.id,
    );

    return NextResponse.json({ message: "Blog created.", blog }, { status: 201 });
  } catch (error) {
    console.error("[api/blogs POST]", error);
    const message =
      error instanceof Error ? error.message : "Unable to create blog.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
