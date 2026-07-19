-- Migration: Create company_news table and update market prices/companies for sentiment scoring
CREATE TABLE IF NOT EXISTS company_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE, -- Nullable for macro/global news
    title TEXT NOT NULL,
    content TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    sentiment TEXT NOT NULL,
    confidence NUMERIC DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_news_url UNIQUE (url),
    CONSTRAINT chk_news_category CHECK (category IN ('corporate', 'macro_fx', 'macro_rate', 'macro_geopolitical')),
    CONSTRAINT chk_news_sentiment CHECK (sentiment IN ('positive', 'negative', 'neutral'))
);

-- Indexing for speed in join operations and sliding window calculations
CREATE INDEX IF NOT EXISTS idx_company_news_company_id ON company_news(company_id);
CREATE INDEX IF NOT EXISTS idx_company_news_published_at ON company_news(published_at);
CREATE INDEX IF NOT EXISTS idx_company_news_category ON company_news(category);

-- Add news_sentiment_score to market_prices if not already exists
ALTER TABLE market_prices ADD COLUMN IF NOT EXISTS news_sentiment_score NUMERIC DEFAULT 0.0;
