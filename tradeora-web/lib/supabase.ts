import { createClient as createOriginalClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://kdjsguozssxvtmlmqhpz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanNndW96c3N4dnRtbG1xaHB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NzM0MDMsImV4cCI6MjA5OTQ0OTQwM30.kTSTIVQedOCupcjwidSOca4_m4s6Qp2Wh5t1Zi7_Wmg';

let _rawClient: SupabaseClient | null = null;

function getRawClient(): SupabaseClient {
  if (!_rawClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SUPABASE_ANON_KEY;
    _rawClient = createOriginalClient(supabaseUrl, supabaseAnonKey);
  }
  return _rawClient;
}

export function createClient(url?: string, key?: string) {
  return supabase;
}

export const supabase = new Proxy({} as any, {
  get(_target, prop) {
    // Only use direct PostgreSQL / CockroachDB driver when running on Server Side (Node.js)
    if (prop === 'from' && typeof window === 'undefined') {
      // Dynamic require ensures 'pg' is never bundled into browser client code
      const { fromTable } = require('./postgres-client');
      return (tableName: string) => fromTable(tableName);
    }
    const raw = getRawClient() as any;
    return raw[prop];
  },
});
