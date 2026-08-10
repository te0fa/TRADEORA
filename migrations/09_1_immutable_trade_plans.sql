-- Migration: 09_1_immutable_trade_plans.sql
-- Description: Makes Trade Entry Bounds (entry_price, tp1, tp2, sl, recommended_at) strictly IMMUTABLE

-- 1. Add revision & audit columns to recommended_trades
ALTER TABLE public.recommended_trades
ADD COLUMN IF NOT EXISTS revision_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_trade_id UUID,
ADD COLUMN IF NOT EXISTS invalidation_reason VARCHAR(100);

-- 2. Immutability Function and Trigger
CREATE OR REPLACE FUNCTION prevent_trade_plan_mutation()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.entry_price IS DISTINCT FROM NEW.entry_price) OR
       (OLD.tp1 IS DISTINCT FROM NEW.tp1) OR
       (OLD.tp2 IS DISTINCT FROM NEW.tp2) OR
       (OLD.sl IS DISTINCT FROM NEW.sl) OR
       (OLD.direction IS DISTINCT FROM NEW.direction) OR
       (OLD.recommended_at IS DISTINCT FROM NEW.recommended_at) THEN
        RAISE EXCEPTION 'TRADE_PLAN_IMMUTABLE: Direct modification of historical trade bounds (entry_price, tp1, tp2, sl, recommended_at) is strictly prohibited. Create a new trade revision or invalidate the trade.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_trade_plan_mutation ON public.recommended_trades;
CREATE TRIGGER trg_prevent_trade_plan_mutation
BEFORE UPDATE ON public.recommended_trades
FOR EACH ROW EXECUTE FUNCTION prevent_trade_plan_mutation();
