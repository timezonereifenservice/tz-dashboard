import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getDefaultProjectId } from "@/lib/projects/access";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(`/${getDefaultProjectId(user.userType)}/overview`);
}
