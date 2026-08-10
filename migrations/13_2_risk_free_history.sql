-- migrations/13_2_risk_free_history.sql
-- Time-Versioned Risk-Free Rate History Table (CBE T-Bills)

CREATE TABLE IF NOT EXISTS public.risk_free_rate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    effective_date DATE NOT NULL,
    rate NUMERIC(8,4) NOT NULL, -- Annualized rate e.g. 0.2250 = 22.50%
    source VARCHAR(100) NOT NULL DEFAULT 'cbe_tbill_364d',
    tenor VARCHAR(20) NOT NULL DEFAULT '364D',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_risk_free_date_source UNIQUE (effective_date, source)
);

-- Seed Initial Historical Central Bank of Egypt (CBE) 364-Day T-Bill Rates
INSERT INTO public.risk_free_rate_history (effective_date, rate, source, tenor)
VALUES
    ('2026-01-01', 0.2250, 'cbe_tbill_364d', '364D'),
    ('2026-06-01', 0.2350, 'cbe_tbill_364d', '364D'),
    ('2026-08-01', 0.2400, 'cbe_tbill_364d', '364D')
ON CONFLICT (effective_date, source) DO UPDATE SET rate = EXCLUDED.rate;
