-- migrations/11_2_fee_schedule.sql
-- Time-Versioned Fee Schedule Table for EGX Transactions

CREATE TABLE IF NOT EXISTS public.fee_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fee_type VARCHAR(50) NOT NULL, -- commission, egx_fee, stamp_tax, clearing_fee
    rate NUMERIC(10,6) NOT NULL,    -- e.g. 0.001500 for 0.15%
    calculation_method VARCHAR(20) DEFAULT 'percentage', -- percentage, flat, tiered
    applies_to VARCHAR(10) DEFAULT 'both',               -- buy, sell, both
    source VARCHAR(100) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,                                   -- NULL = currently active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Historical EGX Fee Schedules (Law 199/2020 & Current Rates)
INSERT INTO public.fee_schedule (fee_type, rate, calculation_method, applies_to, source, effective_from, effective_to)
VALUES 
('commission', 0.001500, 'percentage', 'both', 'EGX Brokerage Standard', '2020-01-01', NULL),
('egx_fee', 0.000120, 'percentage', 'both', 'EGX Exchange Fee Directive', '2020-01-01', NULL),
('stamp_tax', 0.001250, 'percentage', 'both', 'Egyptian Law 199/2020 (Legacy Tax)', '2020-01-01', '2021-12-31'),
('stamp_tax', 0.000500, 'percentage', 'both', 'Egyptian Tax Law 2022 Amendment', '2022-01-01', NULL)
ON CONFLICT DO NOTHING;
