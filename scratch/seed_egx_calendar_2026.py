"""
scratch/seed_egx_calendar_2026.py
=================================
Seeds the authoritative 2026 EGX Trading Calendar into CockroachDB.
"""

import os
from datetime import date, timedelta
from dotenv import load_dotenv
import psycopg2
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.calendar import (
    is_trading_day,
    is_ramadan,
    get_holiday_info,
    get_session_bounds
)

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in environment.")
    exit(1)

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True

import psycopg2.extras

with conn.cursor() as cur:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS public.egx_trading_calendar (
            calendar_date DATE PRIMARY KEY,
            is_trading_day BOOLEAN NOT NULL DEFAULT TRUE,
            session_open TIME NOT NULL DEFAULT '10:00:00',
            session_close TIME NOT NULL DEFAULT '14:30:00',
            timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Cairo',
            is_ramadan BOOLEAN NOT NULL DEFAULT FALSE,
            is_special_session BOOLEAN NOT NULL DEFAULT FALSE,
            is_exceptional_closure BOOLEAN NOT NULL DEFAULT FALSE,
            holiday_name VARCHAR(150),
            holiday_type VARCHAR(50),
            notes TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """)

    start_date = date(2026, 1, 1)
    end_date = date(2026, 12, 31)
    curr = start_date

    rows = []
    while curr <= end_date:
        bounds = get_session_bounds(curr)
        holiday = bounds["holiday"]
        is_trade = bounds["is_trading_day"]
        ramadan = bounds["is_ramadan"]
        h_name = holiday["name"] if holiday else None
        h_type = holiday["type"] if holiday else ("WEEKEND" if curr.weekday() in (4, 5) else None)
        open_time = bounds["session_open_local"]
        close_time = bounds["session_close_local"]

        rows.append((
            curr, is_trade, open_time, close_time,
            "Africa/Cairo", ramadan, h_name, h_type
        ))
        curr += timedelta(days=1)

    psycopg2.extras.execute_values(
        cur,
        """
        INSERT INTO public.egx_trading_calendar (
            calendar_date, is_trading_day, session_open, session_close,
            timezone, is_ramadan, holiday_name, holiday_type
        ) VALUES %s
        ON CONFLICT (calendar_date) DO UPDATE SET
            is_trading_day = EXCLUDED.is_trading_day,
            session_open = EXCLUDED.session_open,
            session_close = EXCLUDED.session_close,
            timezone = EXCLUDED.timezone,
            is_ramadan = EXCLUDED.is_ramadan,
            holiday_name = EXCLUDED.holiday_name,
            holiday_type = EXCLUDED.holiday_type,
            updated_at = NOW();
        """,
        rows
    )

    print(f"✅ Successfully seeded {len(rows)} days into public.egx_trading_calendar for 2026!")

conn.close()
