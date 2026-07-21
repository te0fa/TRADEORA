-- Migration 018: Add Fair Value, Last Dividend, and Upside metrics to company_fundamentals

ALTER TABLE company_fundamentals 
ADD COLUMN IF NOT EXISTS fair_value NUMERIC,
ADD COLUMN IF NOT EXISTS fair_value_source TEXT,
ADD COLUMN IF NOT EXISTS last_dividend_amount NUMERIC,
ADD COLUMN IF NOT EXISTS last_dividend_date DATE,
ADD COLUMN IF NOT EXISTS upside_potential NUMERIC;

-- Create index for quick sorting on Fair Value & Dividend Yield
CREATE INDEX IF NOT EXISTS idx_fundamentals_fair_value ON company_fundamentals(fair_value);
CREATE INDEX IF NOT EXISTS idx_fundamentals_div_yield ON company_fundamentals(dividend_yield);
