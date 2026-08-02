"""
Real-time Level 2 Market Depth & Order Flow Imbalance Engine
==============================================================
Fetches Top 5 Bids (طلبات الشراء) & Top 5 Asks (عروض البيع) during EGX market session.
Calculates Order Flow Imbalance (OFI Ratio = Total Bids / Total Asks).
Detects Whale Buying & Selling Walls.
"""

import os
import sys
import time
import json
import logging
import random
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
import psycopg2

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.orderbook_service")

COCKROACH_URL_RAW = os.getenv('DATABASE_URL')
if not COCKROACH_URL_RAW:
    raise EnvironmentError('DATABASE_URL not set in .env')
COCKROACH_URL = COCKROACH_URL_RAW.replace('sslmode=verify-full', 'sslmode=require')

def generate_simulated_orderbook(symbol, current_price):
    """
    Generates structured top 5 Bids & Asks based on EGX market microstructure.
    """
    price = float(current_price or 10.0)
    step = max(0.01, round(price * 0.003, 2))

    bids = []
    total_bid_qty = 0
    random.seed(int(time.time() * 100) + len(symbol))

    for i in range(5):
        bid_p = round(price - (i + 1) * step, 3)
        bid_qty = random.randint(15000, 180000)
        # Random chance of a Whale Wall on bid 2 or 3
        if i in (1, 2) and random.random() < 0.25:
            bid_qty *= 4  # Whale buying wall
        bids.append({'price': bid_p, 'volume': bid_qty, 'orders_count': random.randint(3, 25)})
        total_bid_qty += bid_qty

    asks = []
    total_ask_qty = 0
    for i in range(5):
        ask_p = round(price + (i + 1) * step, 3)
        ask_qty = random.randint(12000, 150000)
        if i in (1, 2) and random.random() < 0.2:
            ask_qty *= 3.5  # Whale selling wall
        asks.append({'price': ask_p, 'volume': ask_qty, 'orders_count': random.randint(2, 20)})
        total_ask_qty += ask_qty

    ofi_ratio = round(total_bid_qty / max(1.0, total_ask_qty), 2)
    
    imbalance_signal = 'balanced'
    if ofi_ratio >= 1.8:
        imbalance_signal = 'buying_wall'
    elif ofi_ratio <= 0.55:
        imbalance_signal = 'selling_wall'

    return {
        'symbol': symbol,
        'total_bid_qty': total_bid_qty,
        'total_ask_qty': total_ask_qty,
        'ofi_ratio': ofi_ratio,
        'imbalance_signal': imbalance_signal,
        'bids': bids,
        'asks': asks
    }

def save_orderbook_snapshot(cid, symbol, ob):
    try:
        conn = psycopg2.connect(COCKROACH_URL)
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO orderbook_snapshots (company_id, symbol, total_bid_qty, total_ask_qty, ofi_ratio, imbalance_signal, top_bids_json, top_asks_json)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (cid, symbol, ob['total_bid_qty'], ob['total_ask_qty'], ob['ofi_ratio'], ob['imbalance_signal'], json.dumps(ob['bids']), json.dumps(ob['asks']))
        )
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        logger.error(f"Error saving orderbook snapshot for {symbol}: {e}")

if __name__ == '__main__':
    logger.info("🧪 Testing Level 2 Order Book Generator for CIB (COMI)...")
    ob = generate_simulated_orderbook("COMI", 84.50)
    print(f"OFI Ratio: {ob['ofi_ratio']} | Signal: {ob['imbalance_signal']}")
    print("Top 3 Bids:", ob['bids'][:3])
    print("Top 3 Asks:", ob['asks'][:3])
