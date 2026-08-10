-- Migration: 08_2_create_model_shadow_predictions.sql
-- Description: Creates model_shadow_predictions table for Model v7 shadow telemetry and promotion gating

CREATE TABLE IF NOT EXISTS public.model_shadow_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(20) NOT NULL,
    as_of_date DATE NOT NULL,
    v6_prediction INT,
    v6_probability NUMERIC,
    v7_prediction INT,
    v7_probability NUMERIC,
    agreed BOOLEAN NOT NULL DEFAULT FALSE,
    actual_outcome INT, -- Filled after trade completion for OOS ground truth comparison
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_shadow_pred UNIQUE (symbol, as_of_date)
);

CREATE INDEX IF NOT EXISTS idx_shadow_lookup ON public.model_shadow_predictions (symbol, as_of_date DESC);
CREATE INDEX IF NOT EXISTS idx_shadow_date ON public.model_shadow_predictions (as_of_date);

CREATE TABLE IF NOT EXISTS public.model_promotion_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoted_version VARCHAR(30) NOT NULL, -- e.g. 'v7_clean'
    previous_version VARCHAR(30) NOT NULL, -- e.g. 'v6_production'
    approved_by VARCHAR(100) NOT NULL,
    approval_reason TEXT NOT NULL,
    sample_size_n INT NOT NULL,
    v6_accuracy NUMERIC,
    v7_accuracy NUMERIC,
    v7_roc_auc NUMERIC,
    promoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
