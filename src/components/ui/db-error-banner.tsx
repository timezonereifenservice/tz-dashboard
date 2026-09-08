import { Alert, AlertTitle } from "@mui/material";

type DbErrorBannerProps = {
  projectName: string;
  message: string;
};

export function DbErrorBanner({ projectName, message }: DbErrorBannerProps) {
  const isConnection =
    message.includes("ENOTFOUND") ||
    message.includes("tenant/user") ||
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed");

  return (
    <Alert severity="warning" sx={{ mb: 3 }}>
      <AlertTitle>Could not load data for {projectName}</AlertTitle>
      {isConnection
        ? "Database connection failed. Check Supabase credentials in .env.local and restart the dev server."
        : message}
    </Alert>
  );
}
