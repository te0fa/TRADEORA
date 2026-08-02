-- Migration: Create corporate_events, insider_trading tables and extend company_news
-- Date: 2026-08-01

CREATE TABLE IF NOT EXISTS corporate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  event_type VARCHAR(50) NOT NULL DEFAULT 'earnings', -- 'earnings', 'general_assembly', 'dividend', 'board_meeting'
  event_date TIMESTAMPTZ NOT NULL,
  countdown_days INTEGER DEFAULT 0,
  expected_impact_ar TEXT,
  details_ar TEXT,
  source_url TEXT,
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corporate_events_company ON corporate_events(company_id, event_date);
CREATE INDEX IF NOT EXISTS idx_corporate_events_type ON corporate_events(event_type);
CREATE INDEX IF NOT EXISTS idx_corporate_events_status ON corporate_events(status);

ALTER TABLE corporate_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read corporate_events" ON corporate_events FOR SELECT USING (true);


CREATE TABLE IF NOT EXISTS insider_trading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  insider_name TEXT NOT NULL,
  position_ar VARCHAR(100) DEFAULT 'عضو مجلس إدارة', -- 'رئيس مجلس الإدارة', 'عضو مجلس إدارة', 'مساهم رئيسي', 'تنفيذي'
  transaction_type VARCHAR(10) NOT NULL DEFAULT 'buy', -- 'buy', 'sell'
  shares_count NUMERIC(15,2) DEFAULT 0,
  price NUMERIC(10,4) DEFAULT 0,
  total_value_egp NUMERIC(15,2) DEFAULT 0,
  transaction_date DATE NOT NULL,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insider_trading_company ON insider_trading(company_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_insider_trading_type ON insider_trading(transaction_type);

ALTER TABLE insider_trading ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read insider_trading" ON insider_trading FOR SELECT USING (true);


-- Extend company_news table with source badging and scope
ALTER TABLE company_news ADD COLUMN IF NOT EXISTS source_label_ar VARCHAR(100) DEFAULT '🏛️ البورصة المصرية (رسمي)';
ALTER TABLE company_news ADD COLUMN IF NOT EXISTS scope VARCHAR(20) DEFAULT 'stock_direct'; -- 'stock_direct', 'sector', 'macro'
ALTER TABLE company_news ADD COLUMN IF NOT EXISTS weight NUMERIC(3,2) DEFAULT 1.0; -- 1.0 for direct, 0.3 for sector, 0.2 for macro
