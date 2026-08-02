-- ================================================================
-- TRADEORA: Missing Tables Migration for Supabase
-- التاريخ: 2026-08-02
--
-- الجداول دي موجودة في CockroachDB لكن مش في Supabase
-- كيفية التشغيل:
--   افتح: https://supabase.com/dashboard/project/kdjsguozssxvtmlmqhpz/sql/new
--   انسخ كل حاجة هنا والصقها واضغط Run
-- ================================================================

-- ════════════════════════════════════════════════════
-- 1. CORPORATE EVENTS (إفصاحات الشركات)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.corporate_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        REFERENCES public.companies(id) ON DELETE CASCADE,
  symbol          VARCHAR(20) NOT NULL,
  event_type      VARCHAR(50) NOT NULL DEFAULT 'earnings',
  event_date      TIMESTAMPTZ NOT NULL,
  countdown_days  INTEGER     DEFAULT 0,
  expected_impact_ar TEXT,
  details_ar      TEXT,
  source_url      TEXT,
  status          VARCHAR(20) DEFAULT 'upcoming',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_corporate_events_company
    ON public.corporate_events(company_id, event_date);
CREATE INDEX IF NOT EXISTS idx_corporate_events_type
    ON public.corporate_events(event_type);
CREATE INDEX IF NOT EXISTS idx_corporate_events_status
    ON public.corporate_events(status);

ALTER TABLE public.corporate_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read corporate_events" ON public.corporate_events;
CREATE POLICY "Public read corporate_events"
    ON public.corporate_events FOR SELECT USING (true);

-- ════════════════════════════════════════════════════
-- 2. INSIDER TRADING (تداولات الداخليين)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.insider_trading (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID        REFERENCES public.companies(id) ON DELETE CASCADE,
  symbol           VARCHAR(20) NOT NULL,
  insider_name     TEXT        NOT NULL,
  position_ar      VARCHAR(100) DEFAULT 'عضو مجلس إدارة',
  transaction_type VARCHAR(10) NOT NULL DEFAULT 'buy',
  shares_count     NUMERIC(15,2) DEFAULT 0,
  price            NUMERIC(10,4) DEFAULT 0,
  total_value_egp  NUMERIC(15,2) DEFAULT 0,
  transaction_date DATE        NOT NULL,
  source_url       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insider_trading_company
    ON public.insider_trading(company_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_insider_trading_type
    ON public.insider_trading(transaction_type);

ALTER TABLE public.insider_trading ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read insider_trading" ON public.insider_trading;
CREATE POLICY "Public read insider_trading"
    ON public.insider_trading FOR SELECT USING (true);

-- ════════════════════════════════════════════════════
-- 3. TECHNICAL LEVELS (فيبوناتشي، Order Blocks، FVG)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.technical_levels (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID        REFERENCES public.companies(id) ON DELETE CASCADE,
  symbol          VARCHAR(20) NOT NULL,
  level_type      VARCHAR(40) NOT NULL,
  price           NUMERIC(10,4) NOT NULL,
  confidence_score NUMERIC(4,2) DEFAULT 0.8,
  timeframe       VARCHAR(10) DEFAULT '1d',
  details_ar      TEXT,
  calculated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_technical_levels_company
    ON public.technical_levels(company_id, level_type);

ALTER TABLE public.technical_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read technical_levels" ON public.technical_levels;
CREATE POLICY "Public read technical_levels"
    ON public.technical_levels FOR SELECT USING (true);

-- ════════════════════════════════════════════════════
-- 4. SEASONALITY PATTERNS (الموسمية)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.seasonality_patterns (
  id               UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID      REFERENCES public.companies(id) ON DELETE CASCADE,
  symbol           VARCHAR(20) NOT NULL,
  month            INT       NOT NULL CHECK (month BETWEEN 1 AND 12),
  avg_return_pct   NUMERIC(6,2) DEFAULT 0.0,
  win_rate         NUMERIC(5,2) DEFAULT 50.0,
  sample_size      INT       DEFAULT 5,
  is_bullish_season BOOLEAN  DEFAULT FALSE,
  calculated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, month)
);

CREATE INDEX IF NOT EXISTS idx_seasonality_patterns_company
    ON public.seasonality_patterns(company_id, month);

ALTER TABLE public.seasonality_patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read seasonality_patterns" ON public.seasonality_patterns;
CREATE POLICY "Public read seasonality_patterns"
    ON public.seasonality_patterns FOR SELECT USING (true);

-- ════════════════════════════════════════════════════
-- 5. VOLUME PROFILES (VPOC / VAH / VAL)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.volume_profiles (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID        REFERENCES public.companies(id) ON DELETE CASCADE,
  symbol         VARCHAR(20) NOT NULL,
  period         VARCHAR(10) NOT NULL DEFAULT '30d',
  vpoc           NUMERIC(10,4) NOT NULL,
  vah            NUMERIC(10,4) NOT NULL,
  val            NUMERIC(10,4) NOT NULL,
  poc_volume     NUMERIC(15,2) DEFAULT 0,
  total_volume   NUMERIC(15,2) DEFAULT 0,
  calculated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volume_profiles_company
    ON public.volume_profiles(company_id, period);

ALTER TABLE public.volume_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read volume_profiles" ON public.volume_profiles;
CREATE POLICY "Public read volume_profiles"
    ON public.volume_profiles FOR SELECT USING (true);

-- ════════════════════════════════════════════════════
-- 6. PRICE VOLUME LEVELS (HVN / LVN / VWAP)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.price_volume_levels (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID        REFERENCES public.companies(id) ON DELETE CASCADE,
  symbol         VARCHAR(20) NOT NULL,
  level_type     VARCHAR(30) NOT NULL,
  price          NUMERIC(10,4) NOT NULL,
  strength_score NUMERIC(4,2) DEFAULT 0.5,
  details_ar     TEXT,
  calculated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_volume_levels_company
    ON public.price_volume_levels(company_id, level_type);

ALTER TABLE public.price_volume_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read price_volume_levels" ON public.price_volume_levels;
CREATE POLICY "Public read price_volume_levels"
    ON public.price_volume_levels FOR SELECT USING (true);

-- ════════════════════════════════════════════════════
-- 7. ORDERBOOK SNAPSHOTS (Order Book)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.orderbook_snapshots (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id       UUID        REFERENCES public.companies(id) ON DELETE CASCADE,
  symbol           VARCHAR(20) NOT NULL,
  total_bid_qty    NUMERIC(15,2) DEFAULT 0,
  total_ask_qty    NUMERIC(15,2) DEFAULT 0,
  ofi_ratio        NUMERIC(6,2) DEFAULT 1.0,
  imbalance_signal VARCHAR(30) DEFAULT 'balanced',
  top_bids_json    JSONB       DEFAULT '[]'::jsonb,
  top_asks_json    JSONB       DEFAULT '[]'::jsonb,
  snapshot_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orderbook_snapshots_company
    ON public.orderbook_snapshots(company_id, snapshot_at);

ALTER TABLE public.orderbook_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read orderbook_snapshots" ON public.orderbook_snapshots;
CREATE POLICY "Public read orderbook_snapshots"
    ON public.orderbook_snapshots FOR SELECT USING (true);

-- ════════════════════════════════════════════════════
-- 8. MARKET BREADTH SNAPSHOTS (اتساع السوق)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.market_breadth_snapshots (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  advance_count        INT         NOT NULL DEFAULT 0,
  decline_count        INT         NOT NULL DEFAULT 0,
  unchanged_count      INT         NOT NULL DEFAULT 0,
  pct_above_ma200      NUMERIC(5,2) DEFAULT 50.0,
  mcclellan_oscillator NUMERIC(8,2) DEFAULT 0.0,
  market_health_status VARCHAR(30) DEFAULT 'neutral',
  snapshot_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_breadth_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read market_breadth_snapshots" ON public.market_breadth_snapshots;
CREATE POLICY "Public read market_breadth_snapshots"
    ON public.market_breadth_snapshots FOR SELECT USING (true);

-- ════════════════════════════════════════════════════
-- تحقق نهائي
-- ════════════════════════════════════════════════════
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'corporate_events','insider_trading','technical_levels',
    'seasonality_patterns','volume_profiles','price_volume_levels',
    'orderbook_snapshots','market_breadth_snapshots'
  )
ORDER BY table_name;
