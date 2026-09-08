import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { hashValue } from "@/lib/auth/crypto";
import { setAuthCookies } from "@/lib/auth/cookies";
import {
  LOGIN_LOCK_MINUTES,
  LOGIN_MAX_FAILED_ATTEMPTS,
} from "@/lib/auth/config";
import { createAccessToken, createRefreshToken } from "@/lib/auth/tokens";
import { authQuery } from "@/lib/db/pools";

type LoginBody = { email?: string; password?: string };

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  user_type: "ADMIN" | "EDITOR" | "VIEWER";
  is_active: boolean;
  failed_login_count: number;
  locked_until: Date | string | null;
};

function toDate(value: Date | string | null) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    const { rows } = await authQuery<UserRow>(
      `SELECT id, email, password_hash, user_type, is_active, failed_login_count, locked_until
       FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    const user = rows[0];

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { message: "Your account is inactive." },
        { status: 403 },
      );
    }

    const lockedUntil = toDate(user.locked_until);
    if (lockedUntil && lockedUntil > new Date()) {
      return NextResponse.json(
        { message: "Too many failed attempts. Try again later." },
        { status: 429 },
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const nextFailed = user.failed_login_count + 1;
      const shouldLock = nextFailed >= LOGIN_MAX_FAILED_ATTEMPTS;
      await authQuery(
        `UPDATE users SET failed_login_count = $1, locked_until = $2 WHERE id = $3`,
        [
          shouldLock ? 0 : nextFailed,
          shouldLock
            ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000)
            : null,
          user.id,
        ],
      );
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const sessionId = crypto.randomUUID();
    const access = createAccessToken({
      sub: user.id,
      email: user.email,
      userType: user.user_type,
      sessionId,
    });
    const refresh = createRefreshToken({ sub: user.id, sessionId });

    await authQuery(
      `INSERT INTO auth_sessions
       (id, user_id, access_token_jti, refresh_token_hash, access_expires_at, refresh_expires_at, last_used_at, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, 'ACTIVE')`,
      [
        sessionId,
        user.id,
        access.jti,
        hashValue(refresh.token),
        new Date(Date.now() + 24 * 60 * 60 * 1000),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        req.headers.get("user-agent"),
      ],
    );

    await authQuery(
      `UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1`,
      [user.id],
    );

    await setAuthCookies(access.token, refresh.token);

    return NextResponse.json({ message: "Signed in." });
  } catch (error) {
    console.error("[auth/login]", error);
    const message =
      error instanceof Error &&
      error.message.includes("Missing TZ_TRANSPORT_DATABASE_URL")
        ? "Database not configured. Add TZ_TRANSPORT_DATABASE_URL to .env.local and restart the dev server."
        : "Unable to login right now.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
