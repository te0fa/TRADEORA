-- Migration 002: Add market context to companies and create watchlists tables

-- 1. Alter companies table to add new columns with defaults if not exists
ALTER TABLE companies ADD COLUMN IF NOT EXISTS market TEXT DEFAULT 'EGX';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Egypt';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS exchange TEXT DEFAULT 'EGX';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS asset_type TEXT DEFAULT 'stock';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Set default for existing currency column, and update existing NULL values
ALTER TABLE companies ALTER COLUMN currency SET DEFAULT 'EGP';
UPDATE companies SET currency = 'EGP' WHERE currency IS NULL;

-- Update existing records to populate the new columns with default values if they are NULL
UPDATE companies SET market = 'EGX' WHERE market IS NULL;
UPDATE companies SET country = 'Egypt' WHERE country IS NULL;
UPDATE companies SET exchange = 'EGX' WHERE exchange IS NULL;
UPDATE companies SET asset_type = 'stock' WHERE asset_type IS NULL;
UPDATE companies SET status = 'active' WHERE status IS NULL;

-- 2. Add indexes on symbol, market, sector, status
CREATE INDEX IF NOT EXISTS idx_companies_symbol ON companies(symbol);
CREATE INDEX IF NOT EXISTS idx_companies_market ON companies(market);
CREATE INDEX IF NOT EXISTS idx_companies_sector ON companies(sector);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- 3. Create watchlists and watchlist_items tables
CREATE TABLE IF NOT EXISTS watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID REFERENCES watchlists(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_watchlist_company UNIQUE (watchlist_id, company_id)
);

-- Trigger for updated_at in watchlists
CREATE OR REPLACE TRIGGER update_watchlists_updated_at
    BEFORE UPDATE ON watchlists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at in watchlist_items
CREATE OR REPLACE TRIGGER update_watchlist_items_updated_at
    BEFORE UPDATE ON watchlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Seed default watchlist "المتابعة الرئيسية"
INSERT INTO watchlists (name) 
VALUES ('المتابعة الرئيسية')
ON CONFLICT (name) DO NOTHING;
