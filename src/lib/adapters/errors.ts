export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export function isConnectionError(message: string): boolean {
  return (
    message.includes("ENOTFOUND") ||
    message.includes("ECONNREFUSED") ||
    message.includes("fetch failed") ||
    message.includes("Missing TAKE_BRING") ||
    message.includes("Missing TZ_TRANSPORT") ||
    message.includes("tenant/user") ||
    message.includes("password authentication failed")
  );
}

export const EMPTY_OVERVIEW = {
  totalLeads: 0,
  newLeads30d: 0,
  visitors30d: 0,
  conversionRate30d: 0,
};
