DROP FUNCTION IF EXISTS get_latest_prices();

CREATE OR REPLACE FUNCTION get_latest_prices()
RETURNS TABLE (
  company_id UUID,
  open_price NUMERIC,
  high_price NUMERIC,
  low_price NUMERIC,
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
    mp.open_price,
    mp.high_price,
    mp.low_price,
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

CREATE OR REPLACE FUNCTION get_verification_data()
RETURNS TABLE (
  symbol TEXT,
  open_price NUMERIC,
  high_price NUMERIC,
  low_price NUMERIC
) AS $$
  SELECT c.symbol, mp.open_price, mp.high_price, mp.low_price 
  FROM market_prices mp
  JOIN companies c ON mp.company_id = c.id
  WHERE mp.price_date = (SELECT MAX(price_date) FROM market_prices)
  AND mp.source = 'tradingview'
  LIMIT 5;
$$ LANGUAGE sql STABLE;
