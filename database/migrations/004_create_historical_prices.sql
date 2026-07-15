-- Migration 004: Create historical_prices table

CREATE TABLE IF NOT EXISTS historical_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume BIGINT NOT NULL,
    source TEXT NOT NULL,
    price_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_historical_company_price_date_source UNIQUE (company_id, price_date, source)
);

-- Indexes for optimal historical data retrieval performance
CREATE INDEX IF NOT EXISTS idx_historical_prices_company_id ON historical_prices(company_id);
CREATE INDEX IF NOT EXISTS idx_historical_prices_price_date ON historical_prices(price_date);
