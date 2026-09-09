import { redirect } from "next/navigation";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { getAccessTokenFromCookies } from "@/lib/auth/cookies";
import { getCurrentUser } from "@/lib/auth/session";
import { verifyAccessToken } from "@/lib/auth/tokens";
import { authQuery } from "@/lib/db/pools";
import { canAccessProject } from "@/lib/projects/access";
import { PROJECTS, type ProjectId } from "@/lib/projects/config";

async function getSettingsContext(userId: string, sessionId: string | null) {
  try {
    const { rows: userRows } = await authQuery<{ updated_at: string }>(
      `SELECT updated_at FROM users WHERE id = $1`,
      [userId],
    );

    if (!sessionId) {
      return {
        passwordUpdatedAt: userRows[0]?.updated_at ?? null,
        session: null,
      };
    }

    const { rows: sessionRows } = await authQuery<{
      created_at: string;
      last_used_at: string;
      ip_address: string | null;
      user_agent: string | null;
    }>(
      `SELECT created_at, last_used_at, ip_address, user_agent
       FROM auth_sessions
       WHERE id = $1 AND status = 'ACTIVE'
       LIMIT 1`,
      [sessionId],
    );

    const sessionRow = sessionRows[0];
    return {
      passwordUpdatedAt: userRows[0]?.updated_at ?? null,
      session: sessionRow
        ? {
            startedAt: sessionRow.created_at,
            lastUsedAt: sessionRow.last_used_at,
            ipAddress: sessionRow.ip_address,
            userAgent: sessionRow.user_agent,
          }
        : null,
    };
  } catch {
    return {
      passwordUpdatedAt: null,
      session: null,
    };
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const accessToken = await getAccessTokenFromCookies();
  const payload = accessToken ? verifyAccessToken(accessToken) : null;
  const context = await getSettingsContext(user.id, payload?.sessionId ?? null);

  const accessibleProjects = PROJECTS.filter((project) =>
    canAccessProject(user.userType, project.id as ProjectId),
  );

  return (
    <SettingsPanel
      user={user}
      passwordUpdatedAt={context.passwordUpdatedAt}
      accessibleProjects={accessibleProjects}
      session={context.session}
    />
  );
}
