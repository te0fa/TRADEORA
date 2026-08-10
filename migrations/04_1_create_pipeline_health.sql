-- Migration: 04_1_create_pipeline_health.sql
-- Description: Unified Pipeline Health & Telemetry Heartbeat Table

CREATE TABLE IF NOT EXISTS public.pipeline_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id VARCHAR(100) NOT NULL,
    run_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'RUNNING'
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    duration_ms INT8,
    rows_processed INT4 DEFAULT 0,
    error_code VARCHAR(100),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pipeline_run UNIQUE (pipeline_id, run_id)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_health_lookup ON public.pipeline_health (pipeline_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_pipeline_health_status ON public.pipeline_health (status);
