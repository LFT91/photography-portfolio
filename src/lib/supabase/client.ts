import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }
  return createBrowserClient(url, key);
}

export { hasSupabaseEnv };
