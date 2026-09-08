import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { getAccessTokenFromCookies } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { authQuery } from "@/lib/db/pools";

export async function POST() {
  try {
    const accessToken = await getAccessTokenFromCookies();
    if (accessToken) {
      const payload = verifyAccessToken(accessToken);
      if (payload?.sessionId) {
        await authQuery(
          `UPDATE auth_sessions SET status = 'REVOKED' WHERE id = $1`,
          [String(payload.sessionId)],
        );
      }
    }
    await clearAuthCookies();
    return NextResponse.json({ message: "Signed out." });
  } catch (error) {
    console.error("[auth/logout]", error);
    await clearAuthCookies();
    return NextResponse.json({ message: "Signed out." });
  }
}
