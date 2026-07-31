-- ============================================================
-- Fix: Add Yahoo Finance candle sources to market_sources
-- id = the FK value used in market_prices.source column
-- ============================================================

INSERT INTO public.market_sources (id, name, priority, enabled)
VALUES 
  ('yahoo_1d',  'Yahoo Finance – Daily OHLCV',     5,  true),
  ('yahoo_1h',  'Yahoo Finance – 1H OHLCV',        5,  true),
  ('yahoo_30m', 'Yahoo Finance – 30m OHLCV',       5,  true),
  ('yahoo_15m', 'Yahoo Finance – 15m OHLCV',       5,  true),
  ('yahoo_5m',  'Yahoo Finance – 5m OHLCV',        5,  true)
ON CONFLICT (id) DO NOTHING;
