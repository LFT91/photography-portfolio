import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "@/lib/supabase/env";

/** Cookie-less client for public catalogue reads (allows static/ISR). */
export function createPublicClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export { hasSupabaseEnv };
