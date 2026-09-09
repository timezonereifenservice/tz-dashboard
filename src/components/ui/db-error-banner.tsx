"use client";

import { useRouter } from "next/navigation";
import { ConnectivityErrorBanner } from "@/components/system";

type DbErrorBannerProps = {
  projectName: string;
  message: string;
  onDismiss?: () => void;
};

function formatConnectionMessage(message: string) {
  const isConnection =
    message.includes("ENOTFOUND") ||
    message.includes("tenant/user") ||
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("timeout");

  if (isConnection) {
    return "Database connection failed. Check credentials in .env.local and restart the dev server.";
  }
  return message;
}

export function DbErrorBanner({ projectName, message, onDismiss }: DbErrorBannerProps) {
  const router = useRouter();

  return (
    <ConnectivityErrorBanner
      title={`Could not connect to ${projectName} database`}
      message={formatConnectionMessage(message)}
      cluster="data-source"
      port="5432"
      onRetry={() => router.refresh()}
      dismissible={Boolean(onDismiss)}
      onDismiss={onDismiss}
    />
  );
}
