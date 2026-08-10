-- migrations/14_1_rls_policies.sql
-- Row-Level Security (RLS) & Strict Authorization Controls for CockroachDB / PostgreSQL

-- 1. Enable RLS on Sensitive Account & Trade Tables
ALTER TABLE public.portfolio_equity_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policy to enforce account isolation
DROP POLICY IF EXISTS account_isolation_policy ON public.portfolio_equity_snapshots;
CREATE POLICY account_isolation_policy ON public.portfolio_equity_snapshots
    FOR ALL
    USING (account_id = current_setting('app.current_user_id', true) OR current_setting('app.current_user_role', true) = 'service_role');

-- 2. Public Market Data Tables (Read-Only for Users, Service/Admin Write Only)
ALTER TABLE public.fee_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fee_schedule_read_policy ON public.fee_schedule;
CREATE POLICY fee_schedule_read_policy ON public.fee_schedule FOR SELECT USING (true);

ALTER TABLE public.risk_parameters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS risk_parameters_read_policy ON public.risk_parameters;
CREATE POLICY risk_parameters_read_policy ON public.risk_parameters FOR SELECT USING (true);

ALTER TABLE public.risk_free_rate_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS risk_free_rate_read_policy ON public.risk_free_rate_history;
CREATE POLICY risk_free_rate_read_policy ON public.risk_free_rate_history FOR SELECT USING (true);
