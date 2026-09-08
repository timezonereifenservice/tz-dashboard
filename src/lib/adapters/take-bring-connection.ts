import { isConnectionError } from "@/lib/adapters/errors";

export async function withTakeBringConnection<T>(
  run: (mode: "supabase" | "pg") => Promise<T>,
): Promise<T> {
  const { isTakeBringSupabaseConfigured } = await import("@/lib/supabase/take-bring");

  if (isTakeBringSupabaseConfigured()) {
    try {
      return await run("supabase");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isConnectionError(message)) {
        try {
          return await run("pg");
        } catch {
          throw new Error(
            `Take & Bring database unreachable. Production is at take-bring.vercel.app (different Vercel account — not shujasiddiquis-projects). Copy DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY from that Vercel project into Take-Bring/.env.production, then run npm run sync:env. (${message})`,
          );
        }
      }
      throw error;
    }
  }

  return run("pg");
}
