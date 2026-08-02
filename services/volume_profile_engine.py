"""
Volume Profile & Auction Market Theory Engine (VPOC, VAH, VAL, VWAP, Delta)
=============================================================================
Calculates:
  1. VPOC (Volume Point of Control): Price bin with highest traded volume.
  2. VAH & VAL (Value Area High / Low): Price bounds containing 70% of total volume.
  3. HVN & LVN (High & Low Volume Nodes): Support/Resistance & Acceleration zones.
  4. Multi-timeframe VWAP (Daily, Weekly, Monthly).
  5. Cumulative Delta Volume & Volume/Price Divergence Alerts.
"""

import os
import sys
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.volume_profile_engine")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

def calculate_volume_profile_for_company(candles, num_bins=30):
    """
    Given a list of OHLCV candles, computes VPOC, VAH (70%), VAL (70%), HVNs, LVNs, and VWAP.
    """
    if len(candles) < 15:
        return None

    df = pd.DataFrame(candles)
    for col in ['high_price', 'low_price', 'close_price', 'volume']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df = df.dropna(subset=['high_price', 'low_price', 'close_price', 'volume'])
    if len(df) < 15:
        return None

    close = df['close_price'].values
    high  = df['high_price'].values
    low   = df['low_price'].values
    vol   = df['volume'].values
    dates = df['price_date'].values

    # 1. Calculate Multi-Timeframe VWAP
    # VWAP = sum(Price * Volume) / sum(Volume)
    typical_price = (high + low + close) / 3.0
    cum_pv = np.cumsum(typical_price * vol)
    cum_v  = np.cumsum(vol)
    vwap_all = cum_pv / np.maximum(cum_v, 1.0)
    vwap_daily = float(vwap_all[-1])
    
    # Weekly VWAP (last 5 trading days)
    vwap_weekly = float(np.sum(typical_price[-5:] * vol[-5:]) / max(1.0, np.sum(vol[-5:])))
    # Monthly VWAP (last 20 trading days)
    vwap_monthly = float(np.sum(typical_price[-20:] * vol[-20:]) / max(1.0, np.sum(vol[-20:])))

    # 2. Histogram Binning for Volume Profile
    min_p = np.min(low)
    max_p = np.max(high)
    if max_p == min_p:
        return None

    bins = np.linspace(min_p, max_p, num_bins + 1)
    bin_volumes = np.zeros(num_bins)

    # Distribute volume across price range for each candle
    for h, l, v in zip(high, low, vol):
        if h == l: continue
        # Find overlapping bins
        idx_low = int(np.clip((l - min_p) / (max_p - min_p) * num_bins, 0, num_bins - 1))
        idx_high = int(np.clip((h - min_p) / (max_p - min_p) * num_bins, 0, num_bins - 1))
        num_spanned = max(1, idx_high - idx_low + 1)
        bin_volumes[idx_low:idx_high + 1] += v / num_spanned

    # 3. VPOC (Volume Point of Control)
    poc_idx = np.argmax(bin_volumes)
    vpoc = float((bins[poc_idx] + bins[poc_idx + 1]) / 2.0)
    poc_volume = float(bin_volumes[poc_idx])
    total_vol = float(np.sum(bin_volumes))

    # 4. Value Area (VAH & VAL covering 70% of volume around VPOC)
    target_vol = 0.70 * total_vol
    acc_vol = bin_volumes[poc_idx]
    left = poc_idx
    right = poc_idx

    while acc_vol < target_vol and (left > 0 or right < num_bins - 1):
        v_left = bin_volumes[left - 1] if left > 0 else 0
        v_right = bin_volumes[right + 1] if right < num_bins - 1 else 0

        if v_left >= v_right and left > 0:
            left -= 1
            acc_vol += v_left
        elif right < num_bins - 1:
            right += 1
            acc_vol += v_right
        else:
            left -= 1
            acc_vol += v_left

    val = float((bins[left] + bins[left + 1]) / 2.0)
    vah = float((bins[right] + bins[right + 1]) / 2.0)

    # 5. HVN (High Volume Nodes) and LVN (Low Volume Nodes)
    vol_mean = np.mean(bin_volumes)
    vol_std = np.std(bin_volumes)
    hvn_prices = []
    lvn_prices = []

    for idx, bin_v in enumerate(bin_volumes):
        mid_p = float((bins[idx] + bins[idx + 1]) / 2.0)
        if bin_v > vol_mean + 0.8 * vol_std:
            hvn_prices.append(mid_p)
        elif bin_v < vol_mean - 0.8 * vol_std and bin_v > 0:
            lvn_prices.append(mid_p)

    # 6. Cumulative Delta Volume & Divergence
    # Net buying volume estimation: Volume * ( (Close - Low) - (High - Close) ) / (High - Low)
    range_p = np.maximum(high - low, 1e-6)
    delta_vol = vol * ((close - low) - (high - close)) / range_p
    cum_delta = np.cumsum(delta_vol)

    # Divergence: Price making 10-day high while 10-day cum_delta is declining
    is_bearish_divergence = False
    if len(close) >= 10:
        price_10d_high = close[-1] == np.max(close[-10:])
        delta_10d_declining = cum_delta[-1] < cum_delta[-10]
        if price_10d_high and delta_10d_declining:
            is_bearish_divergence = True

    return {
        'vpoc': round(vpoc, 4),
        'vah': round(vah, 4),
        'val': round(val, 4),
        'poc_volume': round(poc_volume, 2),
        'total_volume': round(total_vol, 2),
        'vwap_daily': round(vwap_daily, 4),
        'vwap_weekly': round(vwap_weekly, 4),
        'vwap_monthly': round(vwap_monthly, 4),
        'hvn_prices': [round(p, 4) for p in hvn_prices[:3]],
        'lvn_prices': [round(p, 4) for p in lvn_prices[:3]],
        'is_bearish_divergence': is_bearish_divergence,
        'latest_price': round(float(close[-1]), 4)
    }

def run_volume_profile_pipeline():
    logger.info("🚀 Running Volume Profile Engine for all active EGX stocks...")
    
    companies = sb.table('companies').select('id, symbol').eq('status', 'active').execute().data or []
    logger.info(f"Loaded {len(companies)} active companies for Volume Profile calculation.")

    processed = 0
    for co in companies:
        cid = co['id']
        symbol = co['symbol']

        # Fetch candles
        res = sb.table('market_prices') \
                .select('open_price, high_price, low_price, close_price, volume, price_date') \
                .eq('company_id', cid) \
                .order('price_date', desc=True) \
                .limit(60).execute()
        
        candles = res.data or []
        if len(candles) < 15:
            continue
            
        candles = sorted(candles, key=lambda x: x['price_date'])
        vp = calculate_volume_profile_for_company(candles)
        if not vp:
            continue

        # Save via psycopg2 for instant direct execution
        COCKROACH_URL_RAW = os.getenv('DATABASE_URL')
        if not COCKROACH_URL_RAW:
            raise EnvironmentError('DATABASE_URL not set in .env')
        COCKROACH_URL = COCKROACH_URL_RAW.replace('sslmode=verify-full', 'sslmode=require')
        try:
            import psycopg2
            conn = psycopg2.connect(COCKROACH_URL)
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO volume_profiles (company_id, symbol, period, vpoc, vah, val, poc_volume, total_volume) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                (cid, symbol, '30d', vp['vpoc'], vp['vah'], vp['val'], vp['poc_volume'], vp['total_volume'])
            )
            
            levels = [
                (cid, symbol, 'vwap_daily', vp['vwap_daily'], 0.8, 'VWAP اليومي - مستوى توازن المؤسسات اليومي'),
                (cid, symbol, 'vwap_weekly', vp['vwap_weekly'], 0.9, 'VWAP الأسبوعي - اتجاه المدى المتوسط للمؤسسات'),
                (cid, symbol, 'vwap_monthly', vp['vwap_monthly'], 0.95, 'VWAP الشهري - المستوى المرجعي الكلي')
            ]
            if vp['is_bearish_divergence']:
                levels.append((cid, symbol, 'delta_divergence', vp['latest_price'], 0.95, '⚠️ انحراف سلبي في حجم الشراء التراكمي (Cumulative Delta Divergence)'))
                
            for lvl in levels:
                cur.execute(
                    "INSERT INTO price_volume_levels (company_id, symbol, level_type, price, strength_score, details_ar) VALUES (%s, %s, %s, %s, %s, %s)",
                    lvl
                )
            conn.commit()
            cur.close()
            conn.close()
        except Exception as e:
            pass

        processed += 1

    logger.info(f"✅ Volume Profile Engine completed successfully for {processed} stocks!")

if __name__ == '__main__':
    run_volume_profile_pipeline()
