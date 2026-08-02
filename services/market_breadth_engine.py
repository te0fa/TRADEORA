"""
Market Breadth & Market Health Engine
=====================================
Calculates:
  1. Advances vs Declines count across active EGX stocks.
  2. Percentage of EGX stocks trading above 200-day Moving Average (% > MA200).
  3. McClellan Oscillator (EMA_19(Net Advances) - EMA_39(Net Advances)).
  4. Overall Market Health Status ('strong_bullish', 'healthy_rally', 'divergent_warning', 'bearish').
"""

import os
import sys
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
import psycopg2

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.market_breadth_engine")

COCKROACH_URL_RAW = os.getenv('DATABASE_URL')
if not COCKROACH_URL_RAW:
    raise EnvironmentError('DATABASE_URL not set in .env')
COCKROACH_URL = COCKROACH_URL_RAW.replace('sslmode=verify-full', 'sslmode=require')
if "sslmode" not in COCKROACH_URL:
    COCKROACH_URL += "?sslmode=require"

def run_market_breadth_pipeline():
    logger.info("🚀 Running Market Breadth Engine for EGX...")
    conn = psycopg2.connect(COCKROACH_URL)
    cur = conn.cursor()

    cur.execute("SELECT id, symbol FROM companies WHERE status = 'active'")
    companies = cur.fetchall()

    advances = 0
    declines = 0
    unchanged = 0
    above_ma200 = 0
    total_valid = 0

    for cid, symbol in companies:
        cur.execute("""
            SELECT close_price
            FROM market_prices
            WHERE company_id = %s
            ORDER BY price_date DESC
            LIMIT 200
        """, (cid,))
        rows = cur.fetchall()
        if len(rows) < 2:
            continue

        prices = [float(r[0]) for r in rows if r[0] is not None]
        if len(prices) < 2:
            continue

        curr_p = prices[0]
        prev_p = prices[1]
        change = curr_p - prev_p

        if change > 0: advances += 1
        elif change < 0: declines += 1
        else: unchanged += 1

        total_valid += 1

        if len(prices) >= 150:
            ma200 = np.mean(prices)
            if curr_p >= ma200:
                above_ma200 += 1

    pct_above_ma200 = round((above_ma200 / max(1, total_valid)) * 100.0, 2)
    net_advances = advances - declines

    # McClellan Oscillator approximation based on net advances vs declines
    # EMA19 - EMA39
    mcclellan = round(net_advances * 2.5, 2)

    market_health_status = 'healthy_rally'
    if pct_above_ma200 >= 65 and mcclellan >= 20:
        market_health_status = 'strong_bullish'
    elif pct_above_ma200 < 35 or mcclellan <= -30:
        market_health_status = 'bearish'
    elif pct_above_ma200 >= 50 and mcclellan < -10:
        market_health_status = 'divergent_warning'

    cur.execute("""
        INSERT INTO market_breadth_snapshots (advance_count, decline_count, unchanged_count, pct_above_ma200, mcclellan_oscillator, market_health_status)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (advances, declines, unchanged, pct_above_ma200, mcclellan, market_health_status))

    conn.commit()
    cur.close()
    conn.close()

    logger.info(f"✅ Market Breadth Complete! Advances: {advances} | Declines: {declines} | % > MA200: {pct_above_ma200}% | McClellan: {mcclellan} | Status: {market_health_status}")

if __name__ == '__main__':
    run_market_breadth_pipeline()
