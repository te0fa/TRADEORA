import os
import sys
import logging
import argparse
from datetime import datetime, timezone
import zoneinfo
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

from services.canonical import get_canonical_candles
from scripts.split_detector import detect_price_anomaly, check_entry_price_validity
from train_model_intraday_v2 import extract_features_for_training

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(log_dir, 'generate_intraday_recommendations.log'), encoding='utf-8')
    ]
)
logger = logging.getLogger("tradeora.intraday_generator")

# Load environment
load_dotenv(dotenv_path=Path(__file__).parent / '.env')
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
    sys.exit(1)

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Trading Session Parameters (Cairo Local Time: UTC+3 or Africa/Cairo)
SESSION_START = "10:00"
SESSION_END   = "14:30"

def is_market_open() -> bool:
    """
    Checks if current time falls within EGX trading session (Sunday-Thursday 10:00 - 14:30 Cairo time).
    """
    try:
        cairo_tz = zoneinfo.ZoneInfo("Africa/Cairo")
    except Exception:
        cairo_tz = timezone.utc

    now = datetime.now(cairo_tz)
    # EGX trades Sunday (6) through Thursday (3) in Python weekday notation (Monday=0 ... Sunday=6)
    # Sunday=6, Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5
    if now.weekday() in [4, 5]: # Friday or Saturday -> Closed
        return False

    current_time_str = now.strftime("%H:%M")
    return SESSION_START <= current_time_str <= SESSION_END

def load_intraday_model(timeframe: str):
    m_path = f'models/model_{timeframe}_v2.pkl'
    s_path = f'models/scaler_{timeframe}_v2.pkl'
    
    if not os.path.exists(m_path) or not os.path.exists(s_path):
        logger.warning(f"Intraday model files for {timeframe} not found at {m_path}. Skipping {timeframe}.")
        return None, None
    
    m = joblib.load(m_path)
    s = joblib.load(s_path)
    logger.info(f"Loaded Intraday Model v2 for {timeframe}.")
    return m, s

def scan_and_generate_intraday(force: bool = False):
    logger.info("=== Starting Intraday Trade Recommendation Scanner ===")

    if not force and not is_market_open():
        logger.info("Market is currently closed (EGX Session: Sun-Thu 10:00 - 14:30 Cairo time). Use --force to override.")
        return

    # Load 1h and 15m models
    models = {}
    scalers = {}
    for tf in ['1h', '15m']:
        m, s = load_intraday_model(tf)
        if m and s:
            models[tf] = m
            scalers[tf] = s

    if not models:
        logger.error("No intraday models loaded. Retrain models first using train_model_intraday_v2.py")
        return

    # Fetch active companies
    res = sb.table("companies").select("id, symbol").eq("status", "active").execute()
    companies = res.data or []
    logger.info(f"Loaded {len(companies)} active companies for intraday scanning.")

    signals_generated = 0

    for co in companies:
        cid = co['id']
        symbol = co['symbol']

        for tf, model in models.items():
            scaler = scalers[tf]

            # Fetch recent candles via Canonical Layer
            candles = get_canonical_candles(sb, cid, symbol, limit=100, interval=tf)
            if not candles or len(candles) < 55:
                continue

            extracted = extract_features_for_training(candles)
            if not extracted:
                continue

            # Latest feature vector
            latest_item = extracted[-1]
            feat_row = latest_item['feat_row']

            # Reshape & scale
            X_feat = np.array(feat_row).reshape(1, -1)
            X_scaled = scaler.transform(X_feat)

            # ML Prediction
            prob_buy = float(model.predict_proba(X_scaled)[0][1])

            # Confidence threshold: >= 60%
            if prob_buy >= 0.60:
                latest_candle = candles[-1]
                entry_price = float(latest_candle['close'])

                # Price anomaly check (splits / spikes)
                historical_closes = [c['close'] for c in candles[:-1]]
                if historical_closes and detect_price_anomaly(entry_price, historical_closes):
                    logger.warning(f"[{symbol}] Price anomaly detected ({entry_price}). Skipping signal.")
                    continue

                if not check_entry_price_validity(entry_price):
                    logger.warning(f"[{symbol}] Invalid entry price ({entry_price}). Skipping signal.")
                    continue

                # Deduplicate: Check if active signal exists for this company & timeframe
                existing = sb.table('recommended_trades') \
                             .select('id') \
                             .eq('company_id', cid) \
                             .in_('status', ['active', 'pending']) \
                             .limit(1).execute()
                if existing.data:
                    logger.debug(f"[{symbol}] Active signal already exists. Skipping.")
                    continue

                # Calculate ATR for stop loss & take profit
                trs = [max(c['high']-c['low'], abs(c['high']-candles[idx-1]['close']), abs(c['low']-candles[idx-1]['close']))
                       for idx, c in enumerate(candles[-14:]) if idx > 0]
                atr = sum(trs)/len(trs) if trs else (entry_price * 0.02)

                sl = round(max(0.01, entry_price - (1.5 * atr)), 4)
                tp1 = round(entry_price + (1.5 * atr), 4)
                tp2 = round(entry_price + (3.0 * atr), 4)

                payload = {
                    'company_id': cid,
                    'symbol': symbol,
                    'direction': 'buy',
                    'entry_price': entry_price,
                    'target_price_1': tp1,
                    'target_price_2': tp2,
                    'stop_loss': sl,
                    'status': 'active',
                    'ml_probability': round(prob_buy, 4),
                    'timeframe': tf,
                    'recommended_at': datetime.now(timezone.utc).isoformat(),
                    'notes': f'Intraday ML v2 signal ({tf}) - prob: {prob_buy:.1%}'
                }

                try:
                    sb.table('recommended_trades').insert(payload).execute()
                    signals_generated += 1
                    logger.info(
                        f"⚡ Intraday Signal Generated! [{symbol} - {tf}] "
                        f"BUY @ {entry_price:.2f} | TP1: {tp1:.2f} | SL: {sl:.2f} | Prob: {prob_buy:.1%}"
                    )
                except Exception as ex:
                    logger.error(f"Failed to insert recommended trade for {symbol}: {ex}")

    logger.info(f"=== Intraday Scan Complete: {signals_generated} new signals generated ===")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Run Intraday Recommendation Scanner")
    parser.add_argument('--force', action='store_true', help="Force scan even if market is closed")
    args = parser.parse_args()

    scan_and_generate_intraday(force=args.force)
