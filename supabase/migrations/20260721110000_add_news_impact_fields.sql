-- Migration: Add expected_impact_ar, impact_score, and sector_name to company_news

ALTER TABLE company_news
ADD COLUMN IF NOT EXISTS expected_impact_ar TEXT,
ADD COLUMN IF NOT EXISTS impact_score NUMERIC DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS sector_name TEXT;

CREATE INDEX IF NOT EXISTS idx_company_news_sector_name ON company_news(sector_name);
