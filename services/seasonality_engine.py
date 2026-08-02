"""
Seasonality Patterns Engine
============================
Analyzes 5-year price history per EGX stock to calculate:
  1. Average Monthly Return % (avg_return_pct) for months 1 to 12.
  2. Win Rate % (win_rate) for each month.
  3. Identifies Historically Bullish Months (Win Rate >= 65%).
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
logger = logging.getLogger("tradeora.seasonality_engine")

COCKROACH_URL_RAW = os.getenv('DATABASE_URL')
if not COCKROACH_URL_RAW:
    raise EnvironmentError('DATABASE_URL not set in .env')
COCKROACH_URL = COCKROACH_URL_RAW.replace('sslmode=verify-full', 'sslmode=require')
if "sslmode" not in COCKROACH_URL:
    COCKROACH_URL += "?sslmode=require"

def compute_seasonality_for_company(candles):
    if len(candles) < 60:
        return None

    df = pd.DataFrame(candles)
    df['price_date'] = pd.to_datetime(df['price_date'])
    df['close_price'] = pd.to_numeric(df['close_price'], errors='coerce')
    df = df.dropna(subset=['close_price']).sort_values('price_date')

    df['year'] = df['price_date'].dt.year
    df['month'] = df['price_date'].dt.month

    # Group by year and month to get monthly return
    monthly_data = df.groupby(['year', 'month']).agg(
        start_price=('close_price', 'first'),
        end_price=('close_price', 'last')
    ).reset_index()

    monthly_data['monthly_return_pct'] = (monthly_data['end_price'] - monthly_data['start_price']) / monthly_data['start_price'] * 100.0

    seasonality_stats = []
    for m in range(1, 13):
        m_rows = monthly_data[monthly_data['month'] == m]
        sample_size = len(m_rows)
        if sample_size == 0:
            seasonality_stats.append({
                'month': m, 'avg_return_pct': 0.0, 'win_rate': 50.0, 'sample_size': 0, 'is_bullish': False
            })
            continue

        wins = (m_rows['monthly_return_pct'] > 0).sum()
        win_rate = (wins / sample_size) * 100.0
        avg_ret = m_rows['monthly_return_pct'].mean()
        is_bullish = win_rate >= 65.0 or (win_rate >= 50.0 and avg_ret >= 4.0)

        seasonality_stats.append({
            'month': m,
            'avg_return_pct': round(float(avg_ret), 2),
            'win_rate': round(float(win_rate), 1),
            'sample_size': int(sample_size),
            'is_bullish': bool(is_bullish)
        })

    return seasonality_stats

def run_seasonality_pipeline():
    logger.info("🚀 Running Seasonality Patterns Engine for EGX stocks...")
    conn = psycopg2.connect(COCKROACH_URL)
    cur = conn.cursor()

    cur.execute("SELECT id, symbol FROM companies WHERE status = 'active'")
    companies = cur.fetchall()
    logger.info(f"Loaded {len(companies)} active companies for Seasonality calculation.")

    processed = 0
    for cid, symbol in companies:
        cur.execute("""
            SELECT open_price, high_price, low_price, close_price, price_date
            FROM market_prices
            WHERE company_id = %s
            ORDER BY price_date ASC
        """, (cid,))
        rows = cur.fetchall()
        if len(rows) < 60:
            continue

        candles = [{'close_price': r[3], 'price_date': r[4]} for r in rows]
        stats = compute_seasonality_for_company(candles)
        if not stats:
            continue

        for st in stats:
            cur.execute("""
                INSERT INTO seasonality_patterns (company_id, symbol, month, avg_return_pct, win_rate, sample_size, is_bullish_season)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (company_id, month) DO UPDATE SET
                  avg_return_pct = EXCLUDED.avg_return_pct,
                  win_rate = EXCLUDED.win_rate,
                  sample_size = EXCLUDED.sample_size,
                  is_bullish_season = EXCLUDED.is_bullish_season,
                  calculated_at = NOW()
            """, (cid, symbol, st['month'], st['avg_return_pct'], st['win_rate'], st['sample_size'], st['is_bullish']))

        conn.commit()
        processed += 1

    cur.close()
    conn.close()
    logger.info(f"✅ Seasonality Engine completed successfully for {processed} stocks!")

if __name__ == '__main__':
    run_seasonality_pipeline()
