import os
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
conn.autocommit = True
cur = conn.cursor()

cur.execute("ALTER TABLE public.recommended_trades ADD COLUMN IF NOT EXISTS classification VARCHAR(30) NOT NULL DEFAULT 'LEGACY_RESEARCH';")
print("✅ Column classification added successfully!")

cur.execute("SELECT * FROM public.recommended_trades LIMIT 1;")
colnames = [desc[0] for desc in cur.description]
print("New Columns in recommended_trades:", colnames)

conn.close()
