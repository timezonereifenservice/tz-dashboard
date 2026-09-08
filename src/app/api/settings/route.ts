import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth/session";
import { authQuery } from "@/lib/db/pools";

type Body = {
  currentPassword?: string;
  newPassword?: string;
};

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Body;
  const currentPassword = body.currentPassword?.trim();
  const newPassword = body.newPassword?.trim();

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { message: "Current password and new password (min 8 chars) required." },
      { status: 400 },
    );
  }

  const { rows } = await authQuery<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = $1`,
    [user.id],
  );
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, row.password_hash);
  if (!valid) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await authQuery(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [
    passwordHash,
    user.id,
  ]);

  return NextResponse.json({ message: "Password updated." });
}
