/**
 * tradeora-web/lib/observability.ts
 * =================================
 * Unified Pipeline Health & Observability SDK (TypeScript)
 * Dispatches heartbeat and telemetry events to public.pipeline_health.
 */

import { createClient } from '@supabase/supabase-js';

export interface PipelineHealthRecord {
  pipeline_id: string;
  run_id: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'RUNNING';
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  rows_processed?: number;
  error_code?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function recordPipelineHeartbeat(record: PipelineHealthRecord): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) {
    console.warn(`[Observability] Supabase unavailable. Logging locally: ${record.pipeline_id} | ${record.status}`);
    return false;
  }

  const finishedAt = record.finished_at || new Date().toISOString();
  const startedAt = record.started_at;
  const durationMs = record.duration_ms ?? Math.max(0, new Date(finishedAt).getTime() - new Date(startedAt).getTime());

  try {
    const { error } = await sb.from('pipeline_health').upsert({
      pipeline_id: record.pipeline_id,
      run_id: record.run_id,
      status: record.status,
      started_at: startedAt,
      finished_at: finishedAt,
      duration_ms: durationMs,
      rows_processed: record.rows_processed ?? 0,
      error_code: record.error_code ?? null,
      error_message: record.error_message ?? null,
      metadata: record.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'pipeline_id, run_id' });

    if (error) {
      console.error(`[Observability] Failed to write pipeline_health:`, error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error(`[Observability] Exception in recordPipelineHeartbeat:`, err);
    return false;
  }
}
