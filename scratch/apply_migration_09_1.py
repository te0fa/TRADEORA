import os
import sys
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')
print("Connecting to CockroachDB with autocommit=True...", flush=True)

conn = psycopg2.connect(os.getenv('DATABASE_URL'), connect_timeout=15)
conn.autocommit = True
cur = conn.cursor()

print("Step 1: Adding plain columns without FK...", flush=True)
cur.execute("ALTER TABLE public.recommended_trades ADD COLUMN IF NOT EXISTS revision_number INT DEFAULT 1;")
cur.execute("ALTER TABLE public.recommended_trades ADD COLUMN IF NOT EXISTS parent_trade_id UUID;")
cur.execute("ALTER TABLE public.recommended_trades ADD COLUMN IF NOT EXISTS invalidation_reason VARCHAR(100);")
print("Step 1 completed!", flush=True)

print("Step 2: Creating trigger function...", flush=True)
cur.execute("""
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
""")
print("Step 2 completed!", flush=True)

print("Step 3: Creating trigger...", flush=True)
cur.execute("DROP TRIGGER IF EXISTS trg_prevent_trade_plan_mutation ON public.recommended_trades;")
cur.execute("CREATE TRIGGER trg_prevent_trade_plan_mutation BEFORE UPDATE ON public.recommended_trades FOR EACH ROW EXECUTE FUNCTION prevent_trade_plan_mutation();")
print("Step 3 completed!", flush=True)

print("✅ Migration 09_1_immutable_trade_plans.sql applied successfully!", flush=True)
conn.close()
