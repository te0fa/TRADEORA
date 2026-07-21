import os
import sys
import logging
from datetime import datetime, timezone
import numpy as np
import pandas as pd
import pandas_ta as ta
import joblib
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(log_dir, 'generate_recommendations.log'), encoding='utf-8')
    ]
)
logger = logging.getLogger("tradeora.generator")

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent / '.env')
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
    sys.exit(1)

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Technical Indicator & Feature Extraction ──────────────────────────────

def calc_rsi(closes, period=14):
    gains, losses = [], []
    for i in range(1, len(closes)):
        d = closes[i] - closes[i-1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    if len(gains) < period:
        return [None]*len(closes)
    ag = sum(gains[:period])/period
    al = sum(losses[:period])/period
    rsi = [None]*len(closes)
    for i in range(period, len(closes)):
        if i > period:
            ag = (ag*(period-1)+gains[i-1])/period
            al = (al*(period-1)+losses[i-1])/period
        rs = ag/al if al else 100
        rsi[i] = 100 - 100/(1+rs)
    return rsi

def calc_ema(closes, n):
    result = [None]*len(closes)
    k = 2/(n+1)
    for i in range(n-1, len(closes)):
        if result[i-1] is None:
            result[i] = sum(closes[i-n+1:i+1])/n
        else:
            result[i] = closes[i]*k + result[i-1]*(1-k)
    return result

def extract_features_for_stock(candles, fund_data):
    """Extracts features matching ML model input"""
    df = pd.DataFrame(candles)
    adx_df = df.ta.adx(length=14)
    if adx_df is not None and not adx_df.empty:
        adx_list = adx_df['ADX_14'].tolist()
        plus_di = adx_df['DMP_14'].tolist()
        minus_di = adx_df['DMN_14'].tolist()
    else:
        adx_list = [None] * len(candles)
        plus_di = [None] * len(candles)
        minus_di = [None] * len(candles)

    closes = [c['close'] for c in candles]
    highs  = [c['high']  for c in candles]
    lows   = [c['low']   for c in candles]
    vols   = [c.get('volume', 0) for c in candles]

    rsi   = calc_rsi(closes, 14)
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    ema20 = calc_ema(closes, 20)
    ema50 = calc_ema(closes, 50)

    i = len(candles) - 1
    cl = closes[i]

    if None in [rsi[i], ema12[i], ema26[i], ema20[i], ema50[i]]:
        return None

    macd_raw  = ema12[i] - ema26[i]
    macd_prev = ((ema12[i-1] or 0) - (ema26[i-1] or 0))
    macd_hist = macd_raw - macd_prev

    trs = [max(highs[j]-lows[j], abs(highs[j]-closes[j-1]), abs(lows[j]-closes[j-1])) for j in range(max(1, i-13), i+1)]
    atr = sum(trs)/len(trs) if trs else (cl * 0.02)

    avg_vol   = sum(vols[i-13:i+1])/14 if i >= 13 else 1
    vol_ratio = vols[i]/avg_vol if avg_vol > 0 else 1
    vol_spike = 1 if vol_ratio >= 3 else 0

    lookback_52 = min(i, 252)
    ath_52  = max(highs[i-lookback_52:i+1])
    dist_ath = (cl - ath_52) / ath_52 * 100

    day_of_week = (datetime.now().weekday() + 1) % 7

    candle_range = highs[i] - lows[i]
    price_pos = (cl - lows[i]) / (candle_range + 0.001)

    # Bollinger Bands
    window = closes[max(0, i-19):i+1]
    mean = sum(window)/len(window) if window else cl
    std = (sum((x-mean)**2 for x in window)/len(window))**0.5 if window else 0.001
    bb_width = (std*4)/mean * 100 if mean else 0
    bb_pos = (cl - mean)/(std*2) if std else 0

    # Stoch RSI
    window_rsi = [x for x in rsi[max(0, i-14):i+1] if x is not None]
    if window_rsi:
        min_r, max_r = min(window_rsi), max(window_rsi)
        stoch_rsi = (rsi[i]-min_r)/(max_r-min_r) if (max_r - min_r > 0) else 0.5
    else:
        stoch_rsi = 0.5

    # Regime
    adx_val = adx_list[i] if (adx_list[i] is not None and not np.isnan(adx_list[i])) else 0.0
    pdi_val = plus_di[i] if (plus_di[i] is not None and not np.isnan(plus_di[i])) else 0.0
    ndi_val = minus_di[i] if (minus_di[i] is not None and not np.isnan(minus_di[i])) else 0.0

    regime = 1.0 if (adx_val > 25 and pdi_val > ndi_val) else (-1.0 if adx_val > 25 else 0.0)

    # Technical + Sentiment + Macro features (22)
    feat_row = [
        rsi[i], macd_hist, macd_raw,
        (cl-ema20[i])/ema20[i]*100, (cl-ema50[i])/ema50[i]*100,
        atr/cl*100, min(vol_ratio, 5), price_pos,
        bb_width, bb_pos, stoch_rsi, vol_spike,
        dist_ath, day_of_week, regime,
        0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0 # Sentiment/macro defaults
    ]

    # Fundamental features (8)
    pe = float(fund_data.get('pe_ratio') or 0.0)
    eps = float(fund_data.get('eps') or 0.0)
    de = float(fund_data.get('debt_equity') or 0.0)
    pm = float(fund_data.get('profit_margin') or 0.0)
    rev_g = float(fund_data.get('revenue_growth') or 0.0)
    earn_g = float(fund_data.get('earnings_growth') or 0.0)
    div_y = float(fund_data.get('dividend_yield') or 0.0)
    fv = float(fund_data.get('fair_value') or 0.0)
    fv_ratio = cl / fv if fv > 0 else 1.0

    feat_row.extend([pe, eps, de, pm, rev_g, earn_g, div_y, fv_ratio])
    return feat_row, cl, atr

# ── Main Pipeline Function ──────────────────────────────────────

def generate_daily_recommendations():
    logger.info("=== Starting Daily Trade Recommendations Generation ===")

    # Fetch currently active recommendations
    try:
        existing_active = sb.table("recommended_trades")\
            .select("company_id")\
            .eq("status", "active")\
            .execute().data
        active_ids = {r['company_id'] for r in (existing_active or [])}
        logger.info(f"Found {len(active_ids)} currently active recommended trades.")
    except Exception as e:
        logger.error(f"Error fetching active recommended trades: {e}")
        active_ids = set()

    # Load 1d model and scaler
    model_path = 'models/model_1d.pkl'
    scaler_path = 'models/scaler_1d.pkl'
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        logger.error("Model or scaler files missing: models/model_1d.pkl, models/scaler_1d.pkl")
        return

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    expected_n_features = getattr(scaler, 'n_features_in_', 15)

    # Fetch companies and fundamentals
    companies = sb.table("companies").select("id, symbol, name_ar").execute().data or []
    fundamentals_res = sb.table("company_fundamentals").select("*").execute().data or []
    fund_map = {f['company_id']: f for f in fundamentals_res}

    logger.info(f"Loaded {len(companies)} companies for analysis.")

    new_recs_count = 0
    updated_recs_count = 0
    stats_count = 0

    for co in companies:
        cid = co['id']
        symbol = co['symbol']

        # Fetch daily market prices
        prices_res = sb.table("market_prices").select(
            "open_price, high_price, low_price, close_price, volume"
        ).eq("company_id", cid).order("price_date", desc=False).limit(300).execute()

        rows = prices_res.data or []
        if len(rows) < 50:
            continue

        candles = [{
            'open': float(r['open_price']) if r['open_price'] else float(r['close_price']),
            'high': float(r['high_price']) if r['high_price'] else float(r['close_price']),
            'low': float(r['low_price']) if r['low_price'] else float(r['close_price']),
            'close': float(r['close_price']),
            'volume': int(r['volume']) if r['volume'] else 0
        } for r in rows if r['close_price']]

        extracted = extract_features_for_stock(candles, fund_map.get(cid, {}))
        if not extracted:
            continue

        feat_row, last_close, atr_val = extracted

        # Model Prediction (Slice features to match trained scaler/model input size)
        feat_input = feat_row[:expected_n_features]
        X_scaled = scaler.transform([feat_input])
        prob = float(model.predict_proba(X_scaled)[0][1])

        # Fundamental Adjustments (Fair Value & Dividend Yield)
        co_fund = fund_map.get(cid, {})
        upside = co_fund.get("upside_potential")
        div_yield = co_fund.get("dividend_yield")
        fair_val = co_fund.get("fair_value")

        # 1. Undervalued Boost
        if upside is not None and upside >= 20.0:
            prob += 0.08
        elif upside is not None and upside >= 10.0:
            prob += 0.04
        elif upside is not None and upside <= -25.0:
            prob -= 0.10  # Penalty for severely overvalued stocks

        # 2. High Dividend Yield Defensive Boost
        if div_yield is not None and div_yield >= 7.0:
            prob += 0.05

        # 3. AI News & Geopolitical Impact Adjustment
        try:
            news_res = sb.table("company_news").select("impact_score").eq("company_id", cid).order("published_at", desc=True).limit(5).execute()
            news_items = news_res.data or []
            if news_items:
                avg_impact = sum(float(n["impact_score"] or 0) for n in news_items) / len(news_items)
                if avg_impact >= 0.25:
                    prob += 0.07  # Positive contract/earnings news boost
                elif avg_impact <= -0.25:
                    prob -= 0.09  # Negative news penalty
        except Exception:
            pass

        prob = min(max(prob, 0.0), 0.99) # Clip between 0 and 0.99

        # ATR Validation
        atr_pct_of_price = (atr_val / last_close) if last_close > 0 else 0
        if atr_pct_of_price > 0.12:
            atr_val = last_close * 0.05

        atr_eff = atr_val if atr_val > 0 else (last_close * 0.02)
        decimals = 4 if last_close < 1.0 else 2
        entry_price = round(last_close, decimals)
        sl_price = round(entry_price - 1.5 * atr_eff, decimals)
        tp1_price = round(entry_price + 2.0 * atr_eff, decimals)
        tp2_price = round(entry_price + 3.5 * atr_eff, decimals)

        # If Fair Value is significantly higher, align TP2 with Fair Value
        if fair_val and float(fair_val) > tp1_price:
            tp2_price = min(round(float(fair_val), decimals), round(entry_price * 1.5, decimals))

        # Risk-Reward Validation
        risk = entry_price - sl_price
        if risk > 0:
            rr = (tp1_price - entry_price) / risk
            if rr > 5 or rr < 1.2:
                logger.info(f"Skipping recommendation for {symbol}: R:R ratio {rr:.2f} out of bounds [1.2, 5.0]")
                continue

        # Condition 1: Probability > 0.65
        if prob > 0.65:
            if cid in active_ids:
                try:
                    sb.table("recommended_trades").update({
                        "ml_probability": round(prob, 4)
                    }).eq("company_id", cid).eq("status", "active").execute()
                    updated_recs_count += 1
                    logger.info(f"🔄 Updated active trade probability for {symbol}: prob={prob:.4f}")
                except Exception as e:
                    logger.error(f"Error updating active trade for {symbol}: {e}")
            else:
                rec_payload = {
                    'company_id': cid,
                    'symbol': symbol,
                    'direction': 'buy',
                    'entry_price': entry_price,
                    'tp1': tp1_price,
                    'tp2': tp2_price,
                    'sl': sl_price,
                    'timeframe': '1d',
                    'status': 'active',
                    'ml_probability': round(prob, 4),
                    'recommended_at': datetime.now(timezone.utc).isoformat()
                }
                try:
                    sb.table("recommended_trades").insert(rec_payload).execute()
                    new_recs_count += 1
                    logger.info(f"✅ Created new recommendation for {symbol}: prob={prob:.4f}, entry={entry_price}, TP1={tp1_price}, SL={sl_price}")
                except Exception as e:
                    logger.error(f"Error inserting new recommendation for {symbol}: {e}")

        # Condition 2: Probability between 0.50 and 0.65 -> Update signal_stats
        elif 0.50 <= prob <= 0.65:
            try:
                existing = sb.table("signal_stats").select("id, total_signals").eq("company_id", cid).eq("timeframe", "1d").eq("signal_type", "buy").execute().data
                if existing:
                    new_total = (existing[0].get("total_signals") or 0) + 1
                    sb.table("signal_stats").update({
                        "total_signals": new_total,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }).eq("id", existing[0]["id"]).execute()
                else:
                    sb.table("signal_stats").insert({
                        "company_id": cid,
                        "symbol": symbol,
                        "timeframe": "1d",
                        "signal_type": "buy",
                        "total_signals": 1,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }).execute()
                stats_count += 1
                logger.info(f"📊 Recorded signal in signal_stats for {symbol}: prob={prob:.4f}")
            except Exception as e:
                logger.error(f"Error updating signal_stats for {symbol}: {e}")

        # Condition 3: Probability < 0.50 -> Ignore completely
        else:
            pass

    logger.info(f"=== Process Complete: {new_recs_count} new recommendations created, {updated_recs_count} existing active updated, {stats_count} stocks updated in signal_stats ===")

if __name__ == "__main__":
    generate_daily_recommendations()
