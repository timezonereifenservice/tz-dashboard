import { notFound, redirect } from "next/navigation";
import { UserDetailPanel } from "@/components/users/user-detail-panel";
import { getCurrentUser } from "@/lib/auth/session";
import { getHubUserById } from "@/lib/users/queries";

type UserDetailPageProps = {
  params: Promise<{ userId: string }>;
};

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.userType !== "ADMIN") redirect("/settings");

  const { userId } = await params;

  let user;
  try {
    user = await getHubUserById(userId);
  } catch (error) {
    console.error("[users/[userId]/page]", error);
    notFound();
  }

  if (!user) notFound();

  return <UserDetailPanel user={user} currentUserId={currentUser.id} />;
}
