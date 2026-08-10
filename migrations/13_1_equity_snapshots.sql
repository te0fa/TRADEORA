-- migrations/13_1_equity_snapshots.sql
-- Real Portfolio Daily Equity Curve Snapshots Table

CREATE TABLE IF NOT EXISTS public.portfolio_equity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    snapshot_date DATE NOT NULL,
    cash_balance NUMERIC(15,4) NOT NULL,
    unrealized_pnl NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    realized_pnl NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    cum_dividends NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
    total_equity NUMERIC(15,4) NOT NULL,
    drawdown_pct NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    peak_equity NUMERIC(15,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_account_snapshot_date UNIQUE (account_id, snapshot_date)
);
