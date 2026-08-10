-- Migration: 06_1_create_fundamentals_snapshots.sql
-- Description: Creates immutable point-in-time fundamentals_snapshots table with strict NULL rule

CREATE TABLE IF NOT EXISTS public.fundamentals_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    period_type VARCHAR(20) NOT NULL DEFAULT 'FY', -- 'Q1' | 'Q2' | 'Q3' | 'FY' | 'SNAPSHOT'
    period_year INT NOT NULL,
    effective_date DATE NOT NULL, -- True disclosure date. NEVER estimated or backdated.
    pe_ratio NUMERIC,
    pb_ratio NUMERIC,
    ps_ratio NUMERIC,
    eps NUMERIC,
    roe NUMERIC,
    roa NUMERIC,
    net_margin NUMERIC,
    debt_to_equity NUMERIC,
    dividend_yield NUMERIC,
    market_cap NUMERIC,
    disclosure_source VARCHAR(150) NOT NULL DEFAULT 'EGX Official Disclosure Bulletin',
    raw_metrics JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fundamental_snapshot UNIQUE (company_id, period_year, period_type, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_fund_pit_lookup ON public.fundamentals_snapshots (symbol, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_fund_pit_date ON public.fundamentals_snapshots (effective_date);

-- Immutability Function and Trigger (INSERT-ONLY Protection)
CREATE OR REPLACE FUNCTION prevent_fundamentals_snapshot_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'FUNDAMENTALS_SNAPSHOT_IMMUTABLE: Updates and Deletions are strictly prohibited on point-in-time snapshots.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_fundamentals_update ON public.fundamentals_snapshots;
CREATE TRIGGER trg_prevent_fundamentals_update
BEFORE UPDATE OR DELETE ON public.fundamentals_snapshots
FOR EACH ROW EXECUTE FUNCTION prevent_fundamentals_snapshot_tampering();
