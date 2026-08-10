import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
conn.autocommit = True

sql_file = Path(__file__).parent.parent / 'migrations' / '05_2_fix_get_latest_prices_rpc.sql'
sql = sql_file.read_text(encoding='utf-8')

with conn.cursor() as cur:
    cur.execute(sql)
    print("✅ Migration 05_2_fix_get_latest_prices_rpc.sql applied successfully!")

conn.close()
