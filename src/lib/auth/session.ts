import { authQuery } from "@/lib/db/pools";
import { getAccessTokenFromCookies } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/tokens";
import type { UserType } from "@/lib/projects/access";
import type { DashboardUser } from "@/lib/auth/types";
import { parseUserNavPermissions } from "@/lib/users/nav-permissions";

type SessionUserRow = {
  user_id: string;
  email: string;
  user_type: UserType;
  is_active: boolean;
  nav_permissions_json: unknown;
};

export type { DashboardUser };

export async function getCurrentUser(): Promise<DashboardUser | null> {
  const accessToken = await getAccessTokenFromCookies();
  if (!accessToken) return null;

  const payload = verifyAccessToken(accessToken);
  if (!payload?.sub || !payload?.jti) return null;

  const { rows } = await authQuery<SessionUserRow>(
    `SELECT
      u.id AS user_id,
      u.email,
      u.user_type,
      u.is_active,
      u.nav_permissions_json
    FROM auth_sessions s
    INNER JOIN users u ON u.id = s.user_id
    WHERE s.id = $1
      AND s.user_id = $2
      AND s.access_token_jti = $3
      AND s.status = 'ACTIVE'
      AND s.access_expires_at > NOW()
      AND s.refresh_expires_at > NOW()
    LIMIT 1`,
    [String(payload.sessionId), String(payload.sub), String(payload.jti)],
  );

  const session = rows[0];
  if (!session?.is_active) return null;

  return {
    id: session.user_id,
    email: session.email,
    userType: session.user_type,
    isActive: session.is_active,
    navPermissions: parseUserNavPermissions(session.nav_permissions_json),
  };
}

export async function requireUser(): Promise<DashboardUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
