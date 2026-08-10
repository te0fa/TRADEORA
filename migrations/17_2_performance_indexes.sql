-- migrations/17_2_performance_indexes.sql
-- Performance Remediation Database Composite Indexes for CockroachDB

-- 1. High-Performance Index for Time Series Market Price Queries (Remediates Bottleneck Rank 1)
CREATE INDEX IF NOT EXISTS idx_market_prices_company_date 
ON public.market_prices (company_id, price_date DESC);

-- 2. Index for Fast Portfolio Equity Snapshot Retrieval
CREATE INDEX IF NOT EXISTS idx_equity_snapshots_account_date 
ON public.portfolio_equity_snapshots (account_id, snapshot_date DESC);

-- Rollback SQL (For Reference / Emergency Reversion):
-- DROP INDEX IF EXISTS public.idx_market_prices_company_date;
-- DROP INDEX IF EXISTS public.idx_equity_snapshots_account_date;
