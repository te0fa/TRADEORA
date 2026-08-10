-- Migration: 05_2_fix_get_latest_prices_rpc.sql
-- Description: Standardizes get_latest_prices() RPC to match services/canonical.py
-- Forbids: mubasher, mubasher_close_only, intraday_consensus, investing, tradingview_provider
-- Canonical Order: tradingview_1d > egx_bulletin > yahoo_historical > tradingview > yahoo_live

DROP FUNCTION IF EXISTS get_latest_prices();

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
  FROM public.market_prices mp
  WHERE mp.source IN ('tradingview_1d', 'egx_bulletin', 'yahoo_historical', 'tradingview', 'yahoo_live')
    AND mp.source NOT IN ('mubasher', 'mubasher_close_only', 'intraday_consensus', 'investing', 'tradingview_provider')
    AND mp.price_date >= (CURRENT_DATE - INTERVAL '10 days')
    AND mp.close_price IS NOT NULL
    AND mp.close_price > 0
  ORDER BY 
    mp.company_id,
    mp.price_date DESC,
    CASE mp.source 
      WHEN 'tradingview_1d'   THEN 1
      WHEN 'egx_bulletin'     THEN 2
      WHEN 'yahoo_historical' THEN 3
      WHEN 'tradingview'      THEN 4
      WHEN 'yahoo_live'       THEN 5
      ELSE 6
    END,
    mp.fetched_at DESC
$$ LANGUAGE sql STABLE;
