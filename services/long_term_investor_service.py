import os
import sys
import logging
import json
import joblib
from datetime import datetime, timezone
import pytz
from pathlib import Path
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.long_term_service")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
    sys.exit(1)

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
from services.canonical import get_canonical_candles

def aggregate_daily_to_weekly(daily_rows: list) -> list:
    if not daily_rows or len(daily_rows) < 15:
        return []
    df = pd.DataFrame(daily_rows)
    df['price_date'] = pd.to_datetime(df['price_date'])
    df = df.sort_values('price_date').set_index('price_date')

    weekly = df.resample('W').agg({
        'open_price': 'first',
        'high_price': 'max',
        'low_price': 'min',
        'close_price': 'last',
        'volume': 'sum'
    }).dropna()

    weekly_candles = []
    for dt, row in weekly.iterrows():
        c = float(row['close_price'])
        h = float(row['high_price'])
        l = float(row['low_price'])
        o = float(row['open_price'])
        v = float(row['volume'])
        if c > 0 and h >= l:
            weekly_candles.append({
                'open': o,
                'high': h,
                'low': l,
                'close': c,
                'volume': v,
                'time': dt.strftime('%Y-%m-%d')
            })
    return weekly_candles

def evaluate_long_term_investment_gems():
    """
    Evaluates all active EGX companies against the Multi-Factor 100-Point Investment Scoring Engine.
    Returns qualified "Long-Term Value Gems" (Score >= 60/100).
    """
    logger.info("=== Starting Multi-Factor Long-Term Investment Evaluation ===")

    # Load 1W ML Model if trained
    w_model_path = 'models/model_1w_v2.pkl'
    w_scaler_path = 'models/scaler_1w_v2.pkl'
    w_model = joblib.load(w_model_path) if os.path.exists(w_model_path) else None
    w_scaler = joblib.load(w_scaler_path) if os.path.exists(w_scaler_path) else None

    # Fetch Companies & Fundamentals
    companies = sb.table("companies").select("id, symbol, name_ar, name_en, sector").eq("status", "active").execute().data or []
    fundamentals_res = sb.table("company_fundamentals").select("*").execute().data or []
    fund_map = {f['company_id']: f for f in fundamentals_res}

    logger.info(f"Evaluating {len(companies)} active companies.")

    gems = []

    for co in companies:
        cid = co['id']
        symbol = co['symbol']

        res = sb.table("market_prices") \
                .select("price_date, open_price, high_price, low_price, close_price, volume") \
                .eq("company_id", cid) \
                .order("price_date", desc=False) \
                .execute()
        daily_rows = res.data or []
        candles_1w = aggregate_daily_to_weekly(daily_rows)

        if not candles_1w or len(candles_1w) < 15:
            continue

        c_fund = fund_map.get(cid, {})
        current_price = float(candles_1w[-1]['close'])
        fair_value = float(c_fund.get('fair_value') or 0)
        upside = float(c_fund.get('upside_potential') or 0)
        div_yield = float(c_fund.get('dividend_yield') or 0)
        pe_ratio = float(c_fund.get('pe_ratio') or 0)
        pb_ratio = float(c_fund.get('pb_ratio') or 0)

        if fair_value > 0 and upside == 0:
            upside = ((fair_value - current_price) / current_price) * 100

        # --- 1. FUNDAMENTALS SCORE (Max 55 pts) ---
        fund_score = 0.0

        # Margin of Safety / Fair Value Upside (Max 30 pts)
        if upside >= 50.0:
            fund_score += 30.0
        elif upside >= 30.0:
            fund_score += 24.0
        elif upside >= 20.0:
            fund_score += 18.0
        elif upside >= 10.0:
            fund_score += 10.0

        # Dividend Yield (Max 15 pts)
        if div_yield >= 10.0:
            fund_score += 15.0
        elif div_yield >= 7.5:
            fund_score += 12.0
        elif div_yield >= 5.0:
            fund_score += 8.0
        elif div_yield >= 3.0:
            fund_score += 4.0

        # Valuation Multiples (Max 10 pts)
        if 0 < pe_ratio <= 10.0:
            fund_score += 5.0
        elif 0 < pe_ratio <= 15.0:
            fund_score += 3.0

        if 0 < pb_ratio <= 1.5:
            fund_score += 5.0
        elif 0 < pb_ratio <= 2.5:
            fund_score += 3.0

        # --- 2. WEEKLY TECHNICAL CONFIRMATION (Max 30 pts) ---
        tech_score = 0.0

        closes = [float(c['close']) for c in candles_1w]
        highs = [float(c['high']) for c in candles_1w]
        lows = [float(c['low']) for c in candles_1w]

        # 1W RSI
        s_closes = pd.Series(closes)
        delta = s_closes.diff()
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        avg_gain = gain.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
        rs = avg_gain / (avg_loss + 1e-10)
        rsi_series = 100 - (100 / (1 + rs))
        rsi_1w = float(rsi_series.iloc[-1]) if not np.isnan(rsi_series.iloc[-1]) else 50.0

        if 35.0 <= rsi_1w <= 60.0:
            tech_score += 10.0 # Ideal Accumulation Zone
        elif 30.0 <= rsi_1w < 35.0 or 60.0 < rsi_1w <= 68.0:
            tech_score += 5.0

        # 1W MACD
        ema12 = s_closes.ewm(span=12, adjust=False).mean()
        ema26 = s_closes.ewm(span=26, adjust=False).mean()
        macd_line = ema12 - ema26
        macd_signal = macd_line.ewm(span=9, adjust=False).mean()
        if float(macd_line.iloc[-1]) > float(macd_signal.iloc[-1]):
            tech_score += 10.0

        # 1W EMA 50
        ema50 = s_closes.ewm(span=50, adjust=False).mean()
        if current_price >= float(ema50.iloc[-1]):
            tech_score += 10.0

        # --- 3. AI NEWS SENTIMENT IMPACT (Max 15 pts) ---
        news_score = 0.0
        try:
            n_res = sb.table("company_news").select("impact_score").eq("company_id", cid).order("published_at", desc=True).limit(5).execute()
            n_items = n_res.data or []
            if n_items:
                avg_imp = sum(float(n["impact_score"] or 0) for n in n_items) / len(n_items)
                if avg_imp >= 0.25:
                    news_score = 10.0 # Positive Boost
                elif avg_imp <= -0.25:
                    news_score = -15.0 # Penalty for severe litigation / risk news
        except Exception:
            pass

        # Total 100-Point Multi-Factor Score
        total_score = round(min(max(fund_score + tech_score + news_score, 0.0), 100.0), 1)

        # Qualification Threshold: Total Score >= 60
        if total_score >= 60.0:
            # Determine Badges
            badges = []
            if upside >= 25.0:
                badges.append({"id": "value_gem", "text_ar": "💎 جوهرة قيمة", "text_en": "Value Gem"})
            if div_yield >= 6.0:
                badges.append({"id": "high_dividend", "text_ar": "💰 توزيعات عالية", "text_en": "High Dividend"})
            if pe_ratio > 0 and pe_ratio <= 10.0:
                badges.append({"id": "defensive_play", "text_ar": "🛡️ ملاذ دفاعي", "text_en": "Defensive Play"})

            target_tp1 = round(current_price * 1.25, 2)
            if fair_value > current_price:
                target_tp1 = round(min(fair_value, current_price * 1.40), 2)
            target_tp2 = round(max(fair_value, current_price * 1.50), 2)
            stop_loss = round(current_price * 0.85, 2)

            gem_payload = {
                "company_id": cid,
                "symbol": symbol,
                "name_ar": co.get("name_ar"),
                "name_en": co.get("name_en"),
                "sector": co.get("sector"),
                "current_price": current_price,
                "fair_value": fair_value,
                "upside_potential": round(upside, 1),
                "dividend_yield": round(div_yield, 1),
                "pe_ratio": round(pe_ratio, 1) if pe_ratio > 0 else None,
                "pb_ratio": round(pb_ratio, 1) if pb_ratio > 0 else None,
                "rsi_1w": round(rsi_1w, 1),
                "investment_score": total_score,
                "badges": badges,
                "recommended_entry": current_price,
                "target_price_1": target_tp1,
                "target_price_2": target_tp2,
                "stop_loss": stop_loss,
                "timeframe": "1w",
                "trade_style": "long_term_investment",
                "trade_style_ar": "🏛️ استثمار طويل الأجل (Value Gem)"
            }
            gems.append(gem_payload)

    # Sort gems by investment score descending
    gems.sort(key=lambda x: x["investment_score"], reverse=True)

    logger.info(f"=== Evaluation Complete: Identified {len(gems)} Long-Term Value & Dividend Gems ===")
    return gems

if __name__ == '__main__':
    res = evaluate_long_term_investment_gems()
    print(json.dumps(res[:5], indent=2, ensure_ascii=False))
