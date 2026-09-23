import { createBrowserClient } from '@supabase/ssr';

/** Returns null when Supabase is not configured, so the app still runs on the local JSON store. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
