import { getCurrentUser } from "@/lib/auth/session";
import { canManageProjectContent } from "@/lib/projects/access";

export async function requireBlogWriter() {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false as const, status: 401, error: "Unauthorized." };
  }
  if (!canManageProjectContent(user.userType)) {
    return { ok: false as const, status: 403, error: "Forbidden." };
  }
  return { ok: true as const, user };
}
