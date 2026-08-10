-- Migration: 05_5a_create_corporate_actions.sql
-- Description: Creates corporate_actions table for Splits, Reverse Splits, Bonus Shares, and Rights Issues

CREATE TABLE IF NOT EXISTS public.corporate_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    action_type VARCHAR(40) NOT NULL, -- 'SPLIT' | 'REVERSE_SPLIT' | 'BONUS_SHARES' | 'RIGHTS_ISSUE'
    ex_date DATE NOT NULL,
    ratio NUMERIC NOT NULL, -- e.g., 2.0 for 2:1 split, 0.5 for 1:2 reverse split, 0.10 for 10% bonus
    adjustment_factor NUMERIC NOT NULL, -- Price multiplier (e.g. 0.5 for 2:1 split)
    shares_before BIGINT,
    shares_after BIGINT,
    subscription_price NUMERIC, -- For Rights Issue subscription
    confirmed_by VARCHAR(100) NOT NULL DEFAULT 'EGX Official Disclosure Bulletin',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_ca_event UNIQUE (company_id, ex_date, action_type)
);

CREATE INDEX IF NOT EXISTS idx_ca_lookup ON public.corporate_actions (symbol, ex_date DESC);
CREATE INDEX IF NOT EXISTS idx_ca_type ON public.corporate_actions (action_type);
