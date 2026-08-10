import os, psycopg2
from dotenv import load_dotenv

load_dotenv()
COCKROACH_URL = (os.getenv("DATABASE_URL")).replace("sslmode=verify-full", "sslmode=require")

conn = psycopg2.connect(COCKROACH_URL)
cur = conn.cursor()

for t in ['corporate_events', 'insider_trading', 'volume_profiles', 'sector_investor_flows']:
    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t}';")
    cols = cur.fetchall()
    print(f"Table {t} columns: {cols}")

cur.close()
conn.close()
