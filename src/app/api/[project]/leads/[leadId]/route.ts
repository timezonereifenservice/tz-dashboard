import { NextRequest, NextResponse } from "next/server";
import { getAdapter } from "@/lib/adapters/registry";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessProject } from "@/lib/projects/access";
import type { ProjectId } from "@/lib/projects/config";

type Params = { params: Promise<{ project: string; leadId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { project, leadId } = await params;
  if (!canAccessProject(user.userType, project as ProjectId)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json()) as { status?: string };
  if (!body.status) {
    return NextResponse.json({ message: "Status is required." }, { status: 400 });
  }

  try {
    const adapter = getAdapter(project as ProjectId);
    const lead = await adapter.updateLeadStatus(leadId, body.status);
    return NextResponse.json({ lead });
  } catch (error) {
    console.error("[leads/patch]", error);
    return NextResponse.json({ message: "Unable to update lead." }, { status: 500 });
  }
}
