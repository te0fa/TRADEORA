-- Migration: 05_4_create_market_data_gaps.sql
-- Description: Creates market_data_gaps table for audit and telemetry

CREATE TABLE IF NOT EXISTS public.market_data_gaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    symbol VARCHAR(20) NOT NULL,
    gap_date DATE NOT NULL,
    gap_type VARCHAR(40) NOT NULL, -- 'MISSING_DAY' | 'INCOMPLETE_OHLC' | 'STALE_FEED' | 'ZERO_VOLUME_ACTIVE'
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    source VARCHAR(50),
    details JSONB DEFAULT '{}'::JSONB,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'RESOLVED' | 'ACKNOWLEDGED' | 'FALSE_POSITIVE'
    CONSTRAINT uq_market_gap UNIQUE (symbol, gap_date, gap_type)
);

CREATE INDEX IF NOT EXISTS idx_market_gaps_lookup ON public.market_data_gaps (symbol, gap_date DESC);
CREATE INDEX IF NOT EXISTS idx_market_gaps_status ON public.market_data_gaps (status, severity);
