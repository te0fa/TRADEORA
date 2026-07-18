CREATE TABLE IF NOT EXISTS signal_stats (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id    uuid REFERENCES companies(id) ON DELETE CASCADE,
  symbol        text NOT NULL,
  timeframe     text NOT NULL,  -- '1d' / '15m' / '1h' / '4h'
  signal_type   text NOT NULL,  -- 'buy' / 'sell'
  total_signals integer NOT NULL DEFAULT 0,
  tp1_hits      integer NOT NULL DEFAULT 0,
  tp2_hits      integer NOT NULL DEFAULT 0,
  avg_bars_tp1  numeric(8,2),
  avg_bars_tp2  numeric(8,2),
  win_rate_tp1  numeric(5,2),   -- 68.50 = 68.5%
  win_rate_tp2  numeric(5,2),
  last_updated  timestamptz DEFAULT now(),
  UNIQUE(company_id, timeframe, signal_type)
);
