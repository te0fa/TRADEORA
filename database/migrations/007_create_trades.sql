CREATE TABLE IF NOT EXISTS recommended_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'buy',
  entry_price NUMERIC NOT NULL,
  tp1 NUMERIC NOT NULL,
  tp2 NUMERIC NOT NULL,
  sl  NUMERIC NOT NULL,
  timeframe TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  exit_reason TEXT,
  exit_price NUMERIC,
  pnl_percent NUMERIC,
  ml_probability NUMERIC,
  win_rate_hist NUMERIC,
  features_snapshot JSONB,
  recommended_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rec_trades_symbol ON recommended_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_rec_trades_status ON recommended_trades(status);
