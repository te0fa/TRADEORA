-- Migration: Create company_fundamentals table
CREATE TABLE IF NOT EXISTS company_fundamentals (
    company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    pe_ratio NUMERIC,
    eps NUMERIC,
    debt_equity NUMERIC,
    profit_margin NUMERIC, -- operating margin
    revenue_growth NUMERIC,
    earnings_growth NUMERIC,
    dividend_yield NUMERIC,
    book_value NUMERIC,
    fair_value NUMERIC, -- calculated via Graham Number
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on company_id for fast join queries
CREATE INDEX IF NOT EXISTS idx_company_fundamentals_company_id ON company_fundamentals(company_id);
