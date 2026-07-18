-- 1. Create the intraday_snapshots table
CREATE TABLE IF NOT EXISTS intraday_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  snapshot_time TIMESTAMPTZ NOT NULL,
  price NUMERIC(12,4),
  open_price NUMERIC(12,4),
  high_price NUMERIC(12,4),
  low_price NUMERIC(12,4),
  volume BIGINT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the unique index to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS intraday_snapshots_unique_idx 
ON intraday_snapshots (company_id, snapshot_time, source);

-- 3. Create the RPC function to generate intraday candles
CREATE OR REPLACE FUNCTION get_intraday_candles(
  p_company_id UUID,
  p_interval_minutes INTEGER DEFAULT 15,
  p_days_back INTEGER DEFAULT 60
)
RETURNS TABLE (
  candle_time TIMESTAMPTZ,
  open_price NUMERIC,
  high_price NUMERIC,
  low_price NUMERIC,
  close_price NUMERIC,
  volume BIGINT
) AS $$
  WITH bucketed AS (
    SELECT
      date_trunc('hour', snapshot_time) +
        (EXTRACT(MINUTE FROM snapshot_time)::int / p_interval_minutes)
        * (p_interval_minutes || ' minutes')::interval AS bucket,
      price,
      volume,
      snapshot_time,
      ROW_NUMBER() OVER (
        PARTITION BY date_trunc('hour', snapshot_time) +
          (EXTRACT(MINUTE FROM snapshot_time)::int / p_interval_minutes)
          * (p_interval_minutes || ' minutes')::interval
        ORDER BY snapshot_time ASC
      ) AS rn_first,
      ROW_NUMBER() OVER (
        PARTITION BY date_trunc('hour', snapshot_time) +
          (EXTRACT(MINUTE FROM snapshot_time)::int / p_interval_minutes)
          * (p_interval_minutes || ' minutes')::interval
        ORDER BY snapshot_time DESC
      ) AS rn_last
    FROM intraday_snapshots
    WHERE company_id = p_company_id
      AND snapshot_time >= NOW() - (p_days_back || ' days')::interval
  )
  SELECT
    bucket AS candle_time,
    MAX(CASE WHEN rn_first = 1 THEN price END) AS open_price,
    MAX(price) AS high_price,
    MIN(price) AS low_price,
    MAX(CASE WHEN rn_last = 1 THEN price END) AS close_price,
    SUM(CASE WHEN rn_last = 1 THEN volume ELSE 0 END) AS volume
  FROM bucketed
  GROUP BY bucket
  ORDER BY bucket ASC
$$ LANGUAGE sql STABLE;
