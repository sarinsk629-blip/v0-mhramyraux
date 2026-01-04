import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  // If envs are missing, return a lightweight no-op client to avoid build failures in environments without Supabase.
  if (!url || !anonKey) {
    return {
      from: () => ({ select: async () => null }),
      // minimal placeholder methods used by the app; extend as needed
      rpc: async () => null,
    } as any;
  }

  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false },
  });
}
