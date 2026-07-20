-- Migration: Create company_fundamentals table
DROP TABLE IF EXISTS company_fundamentals CASCADE;

CREATE TABLE IF NOT EXISTS company_fundamentals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
    pe_ratio NUMERIC,
    pb_ratio NUMERIC,
    eps NUMERIC,
    book_value_ps NUMERIC,
    roe NUMERIC,
    roa NUMERIC,
    profit_margin NUMERIC,
    debt_to_equity NUMERIC,
    current_ratio NUMERIC,
    revenue NUMERIC,
    net_income NUMERIC,
    dividend_yield NUMERIC,
    shares_outstanding BIGINT,
    market_cap NUMERIC,
    fiscal_year INTEGER,
    source TEXT DEFAULT 'yahoo_finance',
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_fundamentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_fundamentals" ON company_fundamentals 
FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_fundamentals_company_id 
ON company_fundamentals(company_id);

