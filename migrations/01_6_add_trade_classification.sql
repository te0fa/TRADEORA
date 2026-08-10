-- TRADEORA EGX — MIGRATION 01.6: ADD FOUR-TIER TAXONOMY CLASSIFICATION COLUMN
-- Database: CockroachDB & Supabase PostgreSQL
-- Table: public.recommended_trades

-- Step 1: Add classification column if not exists with DEFAULT 'LEGACY_RESEARCH'
ALTER TABLE public.recommended_trades 
ADD COLUMN IF NOT EXISTS classification VARCHAR(30) NOT NULL DEFAULT 'LEGACY_RESEARCH';

-- Step 2: Add check constraint for the 4 valid taxonomy tiers
ALTER TABLE public.recommended_trades 
DROP CONSTRAINT IF EXISTS check_trade_classification;

ALTER TABLE public.recommended_trades 
ADD CONSTRAINT check_trade_classification 
CHECK (classification IN ('ALL_HISTORICAL', 'LEGACY_RESEARCH', 'CLEAN_OOS', 'PRODUCTION'));

-- Step 3: Create index on classification for high-performance tier-filtered queries
CREATE INDEX IF NOT EXISTS idx_rec_trades_classification 
ON public.recommended_trades (classification);

-- Step 4: Ensure all 1,545 pre-remediation historical trades are classified as LEGACY_RESEARCH
UPDATE public.recommended_trades 
SET classification = 'LEGACY_RESEARCH' 
WHERE classification IS NULL OR classification = 'ALL_HISTORICAL';
