-- Migration 007: Create corporate_disclosures table and enhance company_news

CREATE TABLE IF NOT EXISTS corporate_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  title TEXT NOT NULL,
  disclosure_type TEXT NOT NULL DEFAULT 'financial_results', -- 'financial_results', 'dividend', 'board_meeting', 'capital_change', 'material_event'
  expected_date TIMESTAMPTZ NOT NULL,
  countdown_days INTEGER DEFAULT 0,
  expected_impact_ar TEXT,
  forecast_summary TEXT,
  actual_summary TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming', -- 'upcoming', 'released', 'delayed'
  impact_score NUMERIC(4,2) DEFAULT 0.0, -- -1.0 to +1.0
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by company_id and expected_date
CREATE INDEX IF NOT EXISTS idx_disclosures_company_date ON corporate_disclosures(company_id, expected_date);
CREATE INDEX IF NOT EXISTS idx_disclosures_status ON corporate_disclosures(status);

-- Enable RLS
ALTER TABLE corporate_disclosures ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read corporate_disclosures" ON corporate_disclosures
  FOR SELECT USING (true);
