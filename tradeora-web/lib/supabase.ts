import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://kdjsguozssxvtmlmqhpz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanNndW96c3N4dnRtbG1xaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NzM0MDMsImV4cCI6MjA5OTQ0OTQwM30.kTSTIVQedOCupcjwidSOca4_m4s6Qp2Wh5t1Zi7_Wmg';

// Lazy singleton — created only when first used, avoids build-time crash
// when env vars are not available during static page data collection.
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_ANON_KEY;
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient() as any)[prop];
  },
});
