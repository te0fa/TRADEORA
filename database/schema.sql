-- 1. Table for Market Sources
CREATE TABLE IF NOT EXISTS market_sources (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    priority INTEGER DEFAULT 1,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial market sources
INSERT INTO market_sources (id, name, priority, enabled) VALUES
('egx_bulletin', 'EGX Official Daily Prices', 1, true),
('mubasher', 'Mubasher Portal', 2, true),
('investing', 'Investing.com', 3, true),
('manual', 'Manual Entry', 4, true)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, priority = EXCLUDED.priority, enabled = EXCLUDED.enabled;

-- 2. Table for Companies
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT UNIQUE NOT NULL,
    isin TEXT,
    name_ar TEXT,
    name_en TEXT,
    logo_url TEXT,
    sector TEXT,
    market_type TEXT,
    currency TEXT,
    listing_status TEXT,
    first_listing_date DATE,
    is_shariah_compliant BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on symbol for fast lookup
CREATE INDEX IF NOT EXISTS idx_companies_symbol ON companies(symbol);

-- 3. Table for Market Prices
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    open_price NUMERIC,
    high_price NUMERIC,
    low_price NUMERIC,
    close_price NUMERIC,
    previous_close NUMERIC,
    change_value NUMERIC,
    change_percent NUMERIC,
    volume BIGINT,
    value_traded NUMERIC,
    source TEXT REFERENCES market_sources(id) ON DELETE RESTRICT,
    price_date DATE NOT NULL,
    data_quality_flag TEXT DEFAULT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_price_date_source UNIQUE (company_id, price_date, source)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_market_prices_company_id ON market_prices(company_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_price_date ON market_prices(price_date);
CREATE INDEX IF NOT EXISTS idx_market_prices_source ON market_prices(source);

-- 4. Table for Import Jobs
CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT REFERENCES market_sources(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL, -- 'running', 'completed', 'failed', 'warnings'
    rows_read INTEGER DEFAULT 0,
    rows_inserted INTEGER DEFAULT 0,
    rows_updated INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger for updated_at in companies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at in market_prices
CREATE OR REPLACE TRIGGER update_market_prices_updated_at
    BEFORE UPDATE ON market_prices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
