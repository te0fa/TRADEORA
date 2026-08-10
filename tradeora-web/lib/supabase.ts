import { createClient as createOriginalClient, SupabaseClient } from '@supabase/supabase-js';

// Credentials must be provided via environment variables

let _rawClient: SupabaseClient | null = null;

export function getRawClient(): SupabaseClient {
  if (!_rawClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL ;
    const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY ;
    _rawClient = createOriginalClient(supabaseUrl, supabaseAnonKey);
  }
  return _rawClient;
}

export function createClient(url?: string, key?: string) {
  return getRawClient();
}

export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    const raw = getRawClient() as any;
    return raw[prop];
  },
});
