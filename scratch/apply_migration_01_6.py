import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
conn.autocommit = True
cur = conn.cursor()

# Step 1: Add classification column
cur.execute("ALTER TABLE public.recommended_trades ADD COLUMN IF NOT EXISTS classification VARCHAR(30) NOT NULL DEFAULT 'LEGACY_RESEARCH';")
print("Added column classification")

# Step 2: Add check constraint
try:
    cur.execute("ALTER TABLE public.recommended_trades DROP CONSTRAINT IF EXISTS check_trade_classification;")
    cur.execute("ALTER TABLE public.recommended_trades ADD CONSTRAINT check_trade_classification CHECK (classification IN ('ALL_HISTORICAL', 'LEGACY_RESEARCH', 'CLEAN_OOS', 'PRODUCTION'));")
    print("Added check constraint")
except Exception as e:
    print("Constraint note:", e)

# Step 3: Index
cur.execute("CREATE INDEX IF NOT EXISTS idx_rec_trades_classification ON public.recommended_trades (classification);")
print("Created index")

conn.close()
