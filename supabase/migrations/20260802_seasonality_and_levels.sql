-- Migration: Create technical_levels, seasonality_patterns, and market_breadth_snapshots tables
-- Date: 2026-08-02

CREATE TABLE IF NOT EXISTS technical_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  level_type VARCHAR(40) NOT NULL, -- 'fib_236', 'fib_382', 'fib_500', 'fib_618', 'fib_786', 'order_block_buy', 'order_block_sell', 'fvg_bullish', 'fvg_bearish'
  price NUMERIC(10,4) NOT NULL,
  confidence_score NUMERIC(4,2) DEFAULT 0.8,
  timeframe VARCHAR(10) DEFAULT '1d',
  details_ar TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technical_levels_company ON technical_levels(company_id, level_type);
ALTER TABLE technical_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read technical_levels" ON technical_levels FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS seasonality_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  avg_return_pct NUMERIC(6,2) DEFAULT 0.0,
  win_rate NUMERIC(5,2) DEFAULT 50.0,
  sample_size INT DEFAULT 5,
  is_bullish_season BOOLEAN DEFAULT FALSE,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, month)
);

CREATE INDEX IF NOT EXISTS idx_seasonality_patterns_company ON seasonality_patterns(company_id, month);
ALTER TABLE seasonality_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read seasonality_patterns" ON seasonality_patterns FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS market_breadth_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_count INT NOT NULL DEFAULT 0,
  decline_count INT NOT NULL DEFAULT 0,
  unchanged_count INT NOT NULL DEFAULT 0,
  pct_above_ma200 NUMERIC(5,2) DEFAULT 50.0,
  mcclellan_oscillator NUMERIC(8,2) DEFAULT 0.0,
  market_health_status VARCHAR(30) DEFAULT 'neutral', -- 'strong_bullish', 'healthy_rally', 'divergent_warning', 'bearish'
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE market_breadth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read market_breadth_snapshots" ON market_breadth_snapshots FOR SELECT USING (true);
