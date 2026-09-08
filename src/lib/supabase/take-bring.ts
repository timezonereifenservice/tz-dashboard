import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getTakeBringSupabase(): SupabaseClient | null {
  const url = process.env.TAKE_BRING_SUPABASE_URL?.trim();
  const key = process.env.TAKE_BRING_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  if (!client) {
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export function isTakeBringSupabaseConfigured() {
  return Boolean(getTakeBringSupabase());
}
