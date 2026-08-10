-- Migration: 05_3_create_market_data_quality_gate.sql
-- Description: Market Data Quality Gate & Quarantine Subsystem

-- 1. Ensure market_prices has data_quality_flag column
ALTER TABLE public.market_prices 
ADD COLUMN IF NOT EXISTS data_quality_flag VARCHAR(40) NOT NULL DEFAULT 'VALID';

-- 2. Create Quarantine Table for Suspicious/Invalid Market Data
CREATE TABLE IF NOT EXISTS public.market_prices_quarantine (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID,
    symbol VARCHAR(20),
    price_date DATE,
    open_price NUMERIC,
    high_price NUMERIC,
    low_price NUMERIC,
    close_price NUMERIC,
    volume BIGINT,
    source VARCHAR(50),
    quality_status VARCHAR(40) NOT NULL, -- 'INVALID' | 'SUSPICIOUS' | 'STALE' | 'MISSING' | 'CORPORATE_ACTION_RELATED'
    rejection_reason TEXT NOT NULL,
    raw_payload JSONB DEFAULT '{}'::JSONB,
    quarantined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    resolution VARCHAR(50) NOT NULL DEFAULT 'PENDING' -- 'PENDING' | 'APPROVED' | 'DISCARDED'
);

CREATE INDEX IF NOT EXISTS idx_quarantine_status ON public.market_prices_quarantine (quality_status, resolution);
CREATE INDEX IF NOT EXISTS idx_quarantine_date ON public.market_prices_quarantine (price_date DESC);
