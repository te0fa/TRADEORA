-- migrations/12_2_risk_parameters.sql
-- Dynamic Time-Versioned Risk Parameters Table

CREATE TABLE IF NOT EXISTS public.risk_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parameter_name VARCHAR(100) NOT NULL,
    value NUMERIC(12,6) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,                                   -- NULL = currently active policy
    approved_by VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    policy_version VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Policy Configuration Matrix
INSERT INTO public.risk_parameters (parameter_name, value, effective_from, effective_to, approved_by, reason, policy_version)
VALUES 
('MAX_RISK_PER_TRADE_PCT', 0.020000, '2020-01-01', NULL, 'Risk Committee', 'Baseline 2% risk per trade policy', 'v1.0'),
('MAX_PORTFOLIO_HEAT_PCT', 0.100000, '2020-01-01', NULL, 'Risk Committee', 'Baseline 10% max cumulative portfolio heat', 'v1.0'),
('MAX_CONCENTRATION_PCT', 0.150000, '2020-01-01', NULL, 'Risk Committee', 'Baseline 15% single stock allocation limit', 'v1.0'),
('MAX_ADV_LIQUIDITY_PCT', 0.100000, '2020-01-01', NULL, 'Risk Committee', 'Baseline 10% ADV 20-day liquidity cap', 'v1.0'),
('MAX_DRAWDOWN_BREAKER_PCT', 0.200000, '2020-01-01', NULL, 'Risk Committee', 'Baseline 20% max drawdown emergency halt', 'v1.0')
ON CONFLICT DO NOTHING;
