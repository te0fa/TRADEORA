-- Migration: Create volume_profiles, price_volume_levels, and orderbook_snapshots tables
-- Date: 2026-08-02

CREATE TABLE IF NOT EXISTS volume_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  period VARCHAR(10) NOT NULL DEFAULT '30d', -- '10d', '30d', '90d'
  vpoc NUMERIC(10,4) NOT NULL,
  vah NUMERIC(10,4) NOT NULL,
  val NUMERIC(10,4) NOT NULL,
  poc_volume NUMERIC(15,2) DEFAULT 0,
  total_volume NUMERIC(15,2) DEFAULT 0,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volume_profiles_company ON volume_profiles(company_id, period);
ALTER TABLE volume_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read volume_profiles" ON volume_profiles FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS price_volume_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  level_type VARCHAR(30) NOT NULL, -- 'hvn', 'lvn', 'vwap_daily', 'vwap_weekly', 'vwap_monthly', 'delta_divergence'
  price NUMERIC(10,4) NOT NULL,
  strength_score NUMERIC(4,2) DEFAULT 0.5,
  details_ar TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_volume_levels_company ON price_volume_levels(company_id, level_type);
ALTER TABLE price_volume_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read price_volume_levels" ON price_volume_levels FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS orderbook_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  total_bid_qty NUMERIC(15,2) DEFAULT 0,
  total_ask_qty NUMERIC(15,2) DEFAULT 0,
  ofi_ratio NUMERIC(6,2) DEFAULT 1.0,
  imbalance_signal VARCHAR(30) DEFAULT 'balanced', -- 'buying_wall', 'selling_wall', 'balanced'
  top_bids_json JSONB DEFAULT '[]'::jsonb,
  top_asks_json JSONB DEFAULT '[]'::jsonb,
  snapshot_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orderbook_snapshots_company ON orderbook_snapshots(company_id, snapshot_at);
ALTER TABLE orderbook_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read orderbook_snapshots" ON orderbook_snapshots FOR SELECT USING (true);
