import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapters/registry";
import { getCurrentUser } from "@/lib/auth/session";
import { assertSameOrigin } from "@/lib/auth/request-guard";
import {
  canAccessProject,
  canManageProjectContent,
} from "@/lib/projects/access";
import type { ProjectId } from "@/lib/projects/config";
import { canAccessProjectNavItem } from "@/lib/users/nav-permissions";

type Params = { params: Promise<{ project: string; leadId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const originError = assertSameOrigin(req);
  if (originError) return originError;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!canManageProjectContent(user.userType)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { project, leadId } = await params;
  const projectId = project as ProjectId;

  if (!canAccessProject(user.userType, projectId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (
    !canAccessProjectNavItem(
      projectId,
      "leads",
      user.userType,
      user.navPermissions,
    )
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { status?: string };
  if (!body.status) {
    return NextResponse.json({ message: "Status is required." }, { status: 400 });
  }

  try {
    const adapter = getAdapter(projectId);
    const lead = await adapter.updateLeadStatus(leadId, body.status);
    return NextResponse.json({ lead });
  } catch (error) {
    console.error("[leads/patch]", error);
    return NextResponse.json({ message: "Unable to update lead." }, { status: 500 });
  }
}
