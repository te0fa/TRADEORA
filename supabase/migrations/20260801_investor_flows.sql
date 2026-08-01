-- ============================================================
-- Migration: Foreign Investor Daily Flow Tables
-- ============================================================

-- 1. Daily aggregate investor flows (from EGX official bulletin)
CREATE TABLE IF NOT EXISTS public.daily_investor_flows (
    id                      SERIAL PRIMARY KEY,
    trade_date              DATE UNIQUE NOT NULL,

    -- Foreigners
    foreigners_buy_egp      NUMERIC(18, 2),
    foreigners_sell_egp     NUMERIC(18, 2),
    foreigners_net_egp      NUMERIC(18, 2),   -- buy - sell (positive = net buyer)

    -- Foreign institutions breakdown
    foreign_inst_buy_egp    NUMERIC(18, 2),
    foreign_inst_sell_egp   NUMERIC(18, 2),
    foreign_inst_net_egp    NUMERIC(18, 2),

    -- Egyptian institutions
    egyptian_inst_buy_egp   NUMERIC(18, 2),
    egyptian_inst_sell_egp  NUMERIC(18, 2),
    egyptian_inst_net_egp   NUMERIC(18, 2),

    -- Arab investors
    arab_buy_egp            NUMERIC(18, 2),
    arab_sell_egp           NUMERIC(18, 2),
    arab_net_egp            NUMERIC(18, 2),

    -- Egyptian individuals
    egyptian_ind_buy_egp    NUMERIC(18, 2),
    egyptian_ind_sell_egp   NUMERIC(18, 2),
    egyptian_ind_net_egp    NUMERIC(18, 2),

    -- Total market volume that day
    total_volume_egp        NUMERIC(18, 2),

    -- Metadata
    source                  VARCHAR(50) DEFAULT 'EGX_OFFICIAL',
    pdf_url                 TEXT,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Sector-level foreign flow (extracted from bulletin)
CREATE TABLE IF NOT EXISTS public.sector_investor_flows (
    id                      SERIAL PRIMARY KEY,
    trade_date              DATE NOT NULL,
    sector_name             TEXT NOT NULL,

    foreigners_net_egp      NUMERIC(18, 2),
    egyptian_inst_net_egp   NUMERIC(18, 2),
    total_volume_egp        NUMERIC(18, 2),

    source                  VARCHAR(50) DEFAULT 'EGX_OFFICIAL',
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(trade_date, sector_name)
);

-- 3. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_daily_flows_date
    ON public.daily_investor_flows(trade_date DESC);

CREATE INDEX IF NOT EXISTS idx_sector_flows_date
    ON public.sector_investor_flows(trade_date DESC, sector_name);

-- 4. Enable Realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_investor_flows;

-- 5. RLS - public read
ALTER TABLE public.daily_investor_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_investor_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read daily_investor_flows"
    ON public.daily_investor_flows FOR SELECT USING (true);

CREATE POLICY "Public read sector_investor_flows"
    ON public.sector_investor_flows FOR SELECT USING (true);
