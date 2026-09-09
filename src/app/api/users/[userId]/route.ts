import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminUser,
  requireUsersMenuAccess,
} from "@/lib/auth/require-admin";
import type { UserType } from "@/lib/projects/access";
import {
  getHubUserById,
  updateHubUser,
} from "@/lib/users/queries";
import {
  sanitizeNavPermissionsForRole,
  type UserNavPermissions,
} from "@/lib/users/nav-permissions";

const USER_TYPES: UserType[] = ["ADMIN", "EDITOR", "VIEWER"];

type RouteContext = {
  params: Promise<{ userId: string }>;
};

type PatchBody = {
  userType?: UserType;
  isActive?: boolean;
  navPermissions?: UserNavPermissions;
};

function isUserType(value: unknown): value is UserType {
  return typeof value === "string" && USER_TYPES.includes(value as UserType);
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const viewer = await requireUsersMenuAccess();
  if (!viewer) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { userId } = await context.params;

  try {
    const user = await getHubUserById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[api/users/[userId] GET]", error);
    return NextResponse.json(
      { message: "Unable to load user right now." },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { userId } = await context.params;

  try {
    const existing = await getHubUserById(userId);
    if (!existing) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const body = (await req.json()) as PatchBody;
    const nextUserType = isUserType(body.userType)
      ? body.userType
      : existing.userType;
    const nextIsActive =
      typeof body.isActive === "boolean" ? body.isActive : existing.isActive;

    if (userId === admin.id) {
      if (nextUserType !== "ADMIN") {
        return NextResponse.json(
          { message: "You cannot change your own admin role." },
          { status: 400 },
        );
      }
      if (!nextIsActive) {
        return NextResponse.json(
          { message: "You cannot deactivate your own account." },
          { status: 400 },
        );
      }
      if (body.navPermissions?.global?.users === false) {
        return NextResponse.json(
          { message: "You cannot remove your own Users menu access." },
          { status: 400 },
        );
      }
    }

    const navPermissions = body.navPermissions
      ? sanitizeNavPermissionsForRole(nextUserType, body.navPermissions)
      : undefined;

    const user = await updateHubUser(userId, {
      userType: nextUserType,
      isActive: nextIsActive,
      navPermissions,
    });

    return NextResponse.json({ user, message: "User updated." });
  } catch (error) {
    console.error("[api/users/[userId] PATCH]", error);
    return NextResponse.json(
      { message: "Unable to update user right now." },
      { status: 500 },
    );
  }
}
