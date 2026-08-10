import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

# 1. Check classification column
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'recommended_trades' AND column_name = 'classification';")
col = cur.fetchall()

# 2. Check egx_trading_calendar count
cur.execute("SELECT count(*) FROM public.egx_trading_calendar;")
cal_count = cur.fetchone()[0]

# 3. Check pipeline_health count
cur.execute("SELECT count(*) FROM public.pipeline_health;")
pipe_count = cur.fetchone()[0]

print(f"1. recommended_trades.classification column: {col}")
print(f"2. egx_trading_calendar total rows: {cal_count}")
print(f"3. pipeline_health total rows: {pipe_count}")

conn.close()
