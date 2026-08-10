-- Migration: 05_5b_create_dividend_ledger.sql
-- Description: Creates dividend_income_ledger table for cash dividend tracking and total return segregation

CREATE TABLE IF NOT EXISTS public.dividend_income_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    trade_id UUID,
    portfolio_id UUID,
    ex_date DATE NOT NULL,
    record_date DATE,
    payment_date DATE,
    shares_held BIGINT NOT NULL,
    amount_per_share NUMERIC NOT NULL,
    gross_amount NUMERIC NOT NULL,
    withholding_tax_rate NUMERIC NOT NULL DEFAULT 0.05, -- 5% Egyptian Tax Law 199/2020 for listed EGX equities
    tax_amount NUMERIC NOT NULL,
    net_amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_trade_dividend UNIQUE (symbol, ex_date, trade_id)
);

CREATE INDEX IF NOT EXISTS idx_dividend_ledger_symbol ON public.dividend_income_ledger (symbol, ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_dividend_ledger_trade ON public.dividend_income_ledger (trade_id);
