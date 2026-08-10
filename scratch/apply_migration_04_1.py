"""
scratch/apply_migration_04_1.py
================================
Applies migrations/04_1_create_pipeline_health.sql to CockroachDB.
"""

import os
from pathlib import Path
from dotenv import load_dotenv
import psycopg2

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set.")
    exit(1)

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True

sql_file = Path(__file__).parent.parent / 'migrations' / '04_1_create_pipeline_health.sql'
sql = sql_file.read_text(encoding='utf-8')

with conn.cursor() as cur:
    cur.execute(sql)
    print("✅ Migration 04_1_create_pipeline_health.sql applied successfully!")

conn.close()
