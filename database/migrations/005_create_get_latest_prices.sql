-- Create get_latest_prices RPC function to efficiently fetch
-- the latest price record for each company with prioritized source resolver.
CREATE OR REPLACE FUNCTION get_latest_prices()
RETURNS TABLE (
  company_id UUID,
  close_price NUMERIC,
  change_value NUMERIC,
  change_percent NUMERIC,
  volume BIGINT,
  source TEXT,
  price_date DATE,
  fetched_at TIMESTAMPTZ,
  data_quality_flag TEXT
) AS $$
  SELECT DISTINCT ON (mp.company_id)
    mp.company_id,
    mp.close_price,
    mp.change_value,
    mp.change_percent,
    mp.volume,
    mp.source,
    mp.price_date,
    mp.fetched_at,
    mp.data_quality_flag
  FROM market_prices mp
  ORDER BY 
    mp.company_id,
    mp.price_date DESC,
    CASE mp.source 
      WHEN 'egx_bulletin' THEN 1 
      WHEN 'tradingview' THEN 2 
      WHEN 'intraday_consensus' THEN 3 
      WHEN 'yahoo_historical' THEN 4
      ELSE 5
    END
$$ LANGUAGE sql STABLE;
