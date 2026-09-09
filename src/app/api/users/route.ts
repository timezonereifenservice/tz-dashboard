import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/require-admin";
import type { UserType } from "@/lib/projects/access";
import {
  createHubUser,
  hubUserEmailExists,
  listHubUsers,
} from "@/lib/users/queries";

const USER_TYPES: UserType[] = ["ADMIN", "EDITOR", "VIEWER"];

type CreateBody = {
  email?: string;
  password?: string;
  userType?: UserType;
  isActive?: boolean;
};

function isUserType(value: unknown): value is UserType {
  return typeof value === "string" && USER_TYPES.includes(value as UserType);
}

export async function GET() {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const users = await listHubUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("[api/users GET]", error);
    return NextResponse.json(
      { message: "Unable to load users right now." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminUser();
  if (!admin) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  try {
    const body = (await req.json()) as CreateBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const userType = body.userType;
    const isActive = body.isActive ?? true;

    if (!email || !password || !isUserType(userType)) {
      return NextResponse.json(
        { message: "Email, password, and role are required." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Enter a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }

    if (await hubUserEmailExists(email)) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 },
      );
    }

    const user = await createHubUser({ email, password, userType, isActive });
    return NextResponse.json({ user, message: "User created." }, { status: 201 });
  } catch (error) {
    console.error("[api/users POST]", error);
    return NextResponse.json(
      { message: "Unable to create user right now." },
      { status: 500 },
    );
  }
}
