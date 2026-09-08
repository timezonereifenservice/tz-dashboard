import { redirect } from "next/navigation";
import { LoginPageView } from "@/components/auth/login-page-view";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return <LoginPageView />;
}
