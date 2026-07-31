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
from scripts.split_detector import detect_price_anomaly, check_entry_price_validity
from services.wyckoff_engine import get_wyckoff_confluence_score, detect_wyckoff_spring, calculate_price_channels
from services.patterns_engine import get_pattern_confluence_score
from services.fundamental_engine import calculate_fundamental_score
from services.smart_money_engine import smart_money_engine
from services.ict_smc_engine import ict_smc_engine
from services.elliott_time_engine import elliott_time_engine

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

# ─── Model Version Control ───────────────────
# لتغيير النموذج: بدّل MODEL_VERSION فقط
# v2 = نموذج 2026-07-30 (MACD fix + clean data)
# v1 = legacy (BUY bias 83.5% - deprecated)
MODEL_VERSION = 'v2'

_model_path  = f'models/model_1d_{MODEL_VERSION}.pkl'
_scaler_path = f'models/scaler_1d_{MODEL_VERSION}.pkl'
_meta_path   = f'models/model_v2_metadata.json'

if not os.path.exists(_model_path):
    raise FileNotFoundError(
        f"Model file not found: {_model_path}\n"
        f"Run train_model_v2.py first."
    )

model  = joblib.load(_model_path)
scaler = joblib.load(_scaler_path)

# قراءة metadata للـ logging
import json
if os.path.exists(_meta_path):
    with open(_meta_path, encoding='utf-8') as _f:
        _meta = json.load(_f)
    buy_pct_val = _meta.get('class_distribution', {}).get('buy_pct') if isinstance(_meta.get('class_distribution'), dict) else _meta.get('buy_pct', '?')
    acc_val = _meta.get('test_accuracy', _meta.get('oof_accuracy', '?'))
    logger.info(
        f"Model loaded: v{_meta.get('version','?')} | "
        f"Accuracy={acc_val} | "
        f"BUY%={buy_pct_val} | "
        f"Trained={_meta.get('trained_at','?')[:10]}"
    )
else:
    logger.info(f"Model loaded: {_model_path}")
# ─────────────────────────────────────────────

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

def calculate_macd_standard(closes: list,
                             fast: int = 12,
                             slow: int = 26,
                             signal: int = 9) -> dict:
    """
    Standard MACD — Industry formula (TradingView/Bloomberg).
    
    MACD Line   = EMA(12) - EMA(26)
    Signal Line = EMA(9) of MACD Line
    Histogram   = MACD Line - Signal Line
    
    FIX: replaces incorrect histogram = MACD(i) - MACD(i-1)
    """
    import pandas as pd
    
    MIN_CANDLES = slow + signal  # 35 على الأقل
    if len(closes) < MIN_CANDLES:
        return {
            'macd_line':   None,
            'signal_line': None,
            'histogram':   None,
            'hist_prev':   None,
            'crossover':   False,
            'crossunder':  False,
        }
    
    s            = pd.Series(closes, dtype=float)
    ema_fast     = s.ewm(span=fast,   adjust=False).mean()
    ema_slow     = s.ewm(span=slow,   adjust=False).mean()
    macd_line    = ema_fast - ema_slow
    signal_line  = macd_line.ewm(span=signal, adjust=False).mean()
    histogram    = macd_line - signal_line
    
    ml  = float(macd_line.iloc[-1])
    sl  = float(signal_line.iloc[-1])
    h   = float(histogram.iloc[-1])
    ml2 = float(macd_line.iloc[-2])
    sl2 = float(signal_line.iloc[-2])
    h2  = float(histogram.iloc[-2])
    
    return {
        'macd_line':   round(ml,  4),
        'signal_line': round(sl,  4),
        'histogram':   round(h,   4),
        'hist_prev':   round(h2,  4),
        'crossover':   (ml > sl and ml2 <= sl2),  # MACD crosses above Signal
        'crossunder':  (ml < sl and ml2 >= sl2),  # MACD crosses below Signal
    }

def extract_features_for_stock(candles, fund_data, symbol=""):
    """Extracts features matching ML model input"""
    if not candles or len(candles) < 35:
        return None

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

    closes_list = [c['close'] for c in candles[:i+1]]
    macd_result = calculate_macd_standard(closes_list)

    if macd_result['histogram'] is None:
        logger.debug(f"[{symbol}] MACD: insufficient data at i={i}")
        return None

    # Sanity check بعد الحساب
    price = closes_list[-1]
    if price > 0 and abs(macd_result['histogram']) > price * 0.3:
        logger.warning(
            f"[{symbol}] MACD histogram unusually large: "
            f"{macd_result['histogram']:.4f} vs price={price:.2f}. "
            f"Possible data quality issue."
        )

    macd_line   = macd_result['macd_line']
    signal_line = macd_result['signal_line']
    macd_hist   = macd_result['histogram']   # ← الصح
    macd_raw    = macd_line                  # للـ feat_row

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
    return feat_row, cl, atr, macd_result

from services.canonical import get_canonical_candles, get_canonical_price, CANONICAL_SOURCES_DAILY

def fetch_canonical_candles(sb, company_id: str, 
                            symbol: str,
                            limit: int = 300) -> list:
    """
    Fetches clean, source-prioritized OHLCV candles via the official 
    Canonical Market Data Layer (services.canonical).
    """
    # Duplicate Signal Check
    existing = sb.table('recommended_trades') \
                 .select('id') \
                 .eq('company_id', company_id) \
                 .in_('status', ['active', 'pending']) \
                 .limit(1).execute()
    if existing.data:
        logger.info(
            f"[{symbol}] Active signal already exists. "
            f"Skipping new signal generation."
        )
        return []
    
    return get_canonical_candles(sb, company_id, symbol, limit=limit, interval='1d')

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

    expected_n_features = getattr(scaler, 'n_features_in_', 15)

    # Fetch companies (ACTIVE ONLY) and fundamentals
    companies = sb.table("companies").select("id, symbol, name_ar").eq("status", "active").execute().data or []
    fundamentals_res = sb.table("company_fundamentals").select("*").execute().data or []
    fund_map = {f['company_id']: f for f in fundamentals_res}

    logger.info(f"Loaded {len(companies)} ACTIVE companies for trade analysis.")

    new_recs_count = 0
    updated_recs_count = 0
    stats_count = 0

    for co in companies:
        cid = co['id']
        symbol = co['symbol']

        candles_raw = fetch_canonical_candles(sb, cid, symbol)
        if len(candles_raw) < 50:
            logger.warning(f"[{symbol}] Insufficient clean data ({len(candles_raw)} candles). Skipping.")
            continue

        candles = candles_raw

        # ─── Split Detection Guard ──────────────────
        if len(candles) >= 10:
            closes_list = [c['close'] for c in candles]
            dates_list  = [c.get('time', c.get('price_date', '')) for c in candles]

            anomaly = detect_price_anomaly(closes_list, dates_list, symbol)

            if anomaly['has_anomaly']:
                logger.warning(
                    f"[{symbol}] Corporate action detected "
                    f"({anomaly['anomaly_type']}) on "
                    f"{anomaly['anomaly_date']}. "
                    f"Skipping signal generation for safety."
                )
                try:
                    sb.table('companies').update({
                        'notes': (
                            f"SPLIT_DETECTED:{anomaly['anomaly_date']}:"
                            f"{anomaly['anomaly_type']}"
                        )
                    }).eq('id', cid).execute()
                except Exception:
                    pass

                continue  # skip this symbol
        # ────────────────────────────────────────────

        extracted = extract_features_for_stock(candles, fund_map.get(cid, {}), symbol=symbol)
        if not extracted:
            continue

        feat_row, last_close, atr_val, macd_res = extracted

        # Model Prediction (Slice features to match trained scaler/model input size)
        feat_input = feat_row[:expected_n_features]
        X_scaled = scaler.transform([feat_input])
        prob = float(model.predict_proba(X_scaled)[0][1])

        # Fundamental Adjustments (Fair Value & Dividend Yield)
        co_fund = fund_map.get(cid, {})
        fund_info = calculate_fundamental_score(co_fund, last_close)
        prob += fund_info.get('fundamental_boost', 0.0)
        fundamental_badge_ar = fund_info.get('badge_ar')

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

        # 4. Wyckoff Accumulation & Price Channel Confluence Boost
        df_candles = pd.DataFrame(candles)
        wyckoff_info = get_wyckoff_confluence_score(df_candles)
        wyckoff_boost = wyckoff_info.get('total_boost', 0.0)
        prob += wyckoff_boost

        # 5. Classical Chart Patterns Confluence Boost (Cup & Handle, Double Bottom, Bull Flag)
        pattern_info = get_pattern_confluence_score(df_candles)
        pattern_boost = pattern_info.get('total_boost', 0.0)
        prob += pattern_boost

        # 6. Smart Money Institutional Accumulation & Volume Spread Boost
        smart_money_info = smart_money_engine.calculate_smart_money_score(df_candles, co.get('sector'))
        sm_boost = smart_money_info.get('ml_boost', 0.0)
        prob += sm_boost
        smart_money_badge_ar = smart_money_info.get('badge_ar')

        # 7. ICT & SMC (Fair Value Gap, Order Block, Liquidity Sweep) Boost
        ict_smc_info = ict_smc_engine.analyze_ict_smc_patterns(df_candles)
        prob += ict_smc_info.get('ml_boost', 0.0)
        ict_smc_badge_ar = ict_smc_info.get('badge_ar')

        # 8. Elliott Wave & Fibonacci Time Window Boost
        elliott_info = elliott_time_engine.analyze_elliott_and_time(df_candles)
        prob += elliott_info.get('ml_boost', 0.0)
        elliott_badge_ar = elliott_info.get('badge_ar')

        prob = min(max(prob, 0.0), 0.99) # Clip between 0 and 0.99

        # ATR Validation
        atr_pct_of_price = (atr_val / last_close) if last_close > 0 else 0
        if atr_pct_of_price > 0.12:
            atr_val = last_close * 0.05

        atr_eff = atr_val if atr_val > 0 else (last_close * 0.02)
        decimals = 4 if last_close < 1.0 else 2
        entry_price = round(last_close, decimals)

        # Wyckoff Spring Detection on recent candles
        wyckoff_spring = detect_wyckoff_spring(df_candles)
        is_wyckoff_spring = wyckoff_spring.get('is_spring', False)
        wyckoff_badge_ar = wyckoff_spring.get('details', {}).get('badge_ar') if is_wyckoff_spring else None

        # Price Channels
        channel_data = calculate_price_channels(df_candles)

        # Classical Pattern Badge
        pattern_badge_ar = pattern_info.get('badge_ar')

        # Condition 1: Probability > 0.65 (High-Conviction BUY Recommendation)
        if prob >= 0.65:
            sl_price = round(entry_price - 1.5 * atr_eff, decimals)
            tp1_price = round(entry_price + 2.0 * atr_eff, decimals)
            tp2_price = round(entry_price + 3.5 * atr_eff, decimals)
            rebound_zone = round(entry_price - 0.6 * atr_eff, decimals)

            # If Fair Value is significantly higher, align TP2 with Fair Value
            if fair_val and float(fair_val) > tp1_price:
                tp2_price = min(round(float(fair_val), decimals), round(entry_price * 1.5, decimals))

            # Risk-Reward Validation
            risk = entry_price - sl_price
            if risk > 0:
                rr = (tp1_price - entry_price) / risk
                if rr > 5.0 or rr < 1.2:
                    logger.info(f"Skipping buy recommendation for {symbol}: R:R ratio {rr:.2f} out of bounds [1.2, 5.0]")
                    continue

            fra_disclaimer = "تنويه الهيئة العامة للرقابة المالية: مستويات الدعم والمقاومة وأهداف الصفقة هي لأغراض الدراسة والتعليم فقط وليست توصية بالبيع أو الشراء."
            
            spring_data = wyckoff_info.get('spring', {})
            is_wyckoff_spring = spring_data.get('is_spring', False)
            wyckoff_badge_ar = spring_data.get('badge_ar') if is_wyckoff_spring else None

            pattern_badge_ar = pattern_info.get('active_badge_ar')

            explanation_ar = f"توصية شراء ودخول مؤكدة بدرجة ثقة {round(prob * 100, 1)}%. " + (
                f"تأكيد تجميع مؤسسي بنمط (Wyckoff Spring) عند الدعم {spring_data.get('support_level')} ج.م. " if is_wyckoff_spring else ""
            ) + (
                f"تأكيد نمط كلاسيكي: ({pattern_badge_ar}). " if pattern_badge_ar else ""
            ) + f"منطقة الارتداد المتوقعة عند {rebound_zone} ج.م مع أهداف عند {tp1_price} ج.م و {tp2_price} ج.م ووقف خسارة {sl_price} ج.م."

            channel_data = wyckoff_info.get('channel', {})

            features_snap = {
                'model_version': MODEL_VERSION,
                'probability': round(prob, 4),
                'atr_14': round(atr_eff, 4),
                'rsi_14': round(feat_row[0], 2) if feat_row else None,
                'macd_line': macd_res['macd_line'],
                'macd_signal': macd_res['signal_line'],
                'macd_hist': macd_res['histogram'],
                'macd_hist_prev': macd_res['hist_prev'],
                'macd_crossover': macd_res['crossover'],
                'macd_crossunder': macd_res['crossunder'],
                'is_wyckoff_spring': is_wyckoff_spring,
                'wyckoff_badge_ar': wyckoff_badge_ar,
                'wyckoff_boost': wyckoff_boost,
                'pattern_badge_ar': pattern_badge_ar,
                'pattern_boost': pattern_boost,
                'smart_money_badge_ar': smart_money_badge_ar,
                'smart_money_score': smart_money_info.get('smart_money_score'),
                'ict_smc_badge_ar': ict_smc_badge_ar,
                'elliott_badge_ar': elliott_badge_ar,
                'fundamental_score': fund_info.get('total_score'),
                'fundamental_tier': fund_info.get('tier_ar'),
                'fundamental_badge_ar': fundamental_badge_ar,
                'price_channel': channel_data if channel_data.get('channel_valid') else None
            }

            if cid in active_ids:
                try:
                    sb.table("recommended_trades").update({
                        "ml_probability": round(prob, 4),
                        "tp1": tp1_price,
                        "tp2": tp2_price,
                        "sl": sl_price,
                        "features_snapshot": features_snap
                    }).eq("company_id", cid).eq("status", "active").execute()
                    updated_recs_count += 1
                    logger.info(f"🔄 Updated active buy trade probability for {symbol}: prob={prob:.4f}")
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
                    'features_snapshot': features_snap,
                    'recommended_at': datetime.now(timezone.utc).isoformat()
                }
                try:
                    sb.table("recommended_trades").insert(rec_payload).execute()
                    new_recs_count += 1
                    logger.info(f"✅ Created new BUY recommendation for {symbol}: prob={prob:.4f}, entry={entry_price}, TP1={tp1_price}, SL={sl_price}")
                except Exception as e:
                    logger.error(f"Error inserting new buy recommendation for {symbol}: {e}")

        # Condition 2: Probability < 0.35 (High-Conviction SELL / EXIT Recommendation)
        elif prob <= 0.35:
            sl_price = round(entry_price + 1.5 * atr_eff, decimals)
            tp1_price = round(entry_price - 2.0 * atr_eff, decimals)
            tp2_price = round(entry_price - 3.5 * atr_eff, decimals)

            # If Fair Value is significantly lower, align TP2 with Fair Value
            if fair_val and float(fair_val) < tp1_price:
                tp2_price = max(round(float(fair_val), decimals), round(entry_price * 0.5, decimals))

            # Risk-Reward Validation
            risk = sl_price - entry_price
            if risk > 0:
                rr = (entry_price - tp1_price) / risk
                if rr > 5.0 or rr < 1.2:
                    logger.info(f"Skipping sell recommendation for {symbol}: R:R ratio {rr:.2f} out of bounds [1.2, 5.0]")
                    continue

            features_snap_sell = {
                'model_version': MODEL_VERSION,
                'probability': round(prob, 4),
                'atr_14': round(atr_eff, 4),
                'rsi_14': round(feat_row[0], 2) if feat_row else None,
                'macd_line': macd_res['macd_line'],
                'macd_signal': macd_res['signal_line'],
                'macd_hist': macd_res['histogram'],
                'macd_hist_prev': macd_res['hist_prev'],
                'macd_crossover': macd_res['crossover'],
                'macd_crossunder': macd_res['crossunder'],
            }

            if cid in active_ids:
                try:
                    sb.table("recommended_trades").update({
                        "ml_probability": round(prob, 4),
                        "tp1": tp1_price,
                        "tp2": tp2_price,
                        "sl": sl_price,
                        "features_snapshot": features_snap_sell
                    }).eq("company_id", cid).eq("status", "active").execute()
                    updated_recs_count += 1
                    logger.info(f"🔄 Updated active sell trade probability for {symbol}: prob={prob:.4f}")
                except Exception as e:
                    logger.error(f"Error updating active trade for {symbol}: {e}")
            else:
                rec_payload = {
                    'company_id': cid,
                    'symbol': symbol,
                    'direction': 'sell',
                    'entry_price': entry_price,
                    'tp1': tp1_price,
                    'tp2': tp2_price,
                    'sl': sl_price,
                    'timeframe': '1d',
                    'status': 'active',
                    'ml_probability': round(prob, 4),
                    'features_snapshot': features_snap_sell,
                    'recommended_at': datetime.now(timezone.utc).isoformat()
                }
                try:
                    sb.table("recommended_trades").insert(rec_payload).execute()
                    new_recs_count += 1
                    logger.info(f"✅ Created new SELL recommendation for {symbol}: prob={prob:.4f}, entry={entry_price}, TP1={tp1_price}, SL={sl_price}")
                except Exception as e:
                    logger.error(f"Error inserting new sell recommendation for {symbol}: {e}")

        # Condition 3: Probability between 0.50 and 0.65 -> Update signal_stats for BUY
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
                logger.info(f"📊 Recorded buy signal in signal_stats for {symbol}: prob={prob:.4f}")
            except Exception as e:
                logger.error(f"Error updating signal_stats for {symbol}: {e}")

        # Condition 4: Probability between 0.35 and 0.50 -> Update signal_stats for SELL
        elif 0.35 <= prob < 0.50:
            try:
                existing = sb.table("signal_stats").select("id, total_signals").eq("company_id", cid).eq("timeframe", "1d").eq("signal_type", "sell").execute().data
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
                        "signal_type": "sell",
                        "total_signals": 1,
                        "last_updated": datetime.now(timezone.utc).isoformat()
                    }).execute()
                stats_count += 1
                logger.info(f"📊 Recorded sell signal in signal_stats for {symbol}: prob={prob:.4f}")
            except Exception as e:
                logger.error(f"Error updating signal_stats for {symbol}: {e}")

    logger.info(f"=== Process Complete: {new_recs_count} new recommendations created, {updated_recs_count} existing active updated, {stats_count} stocks updated in signal_stats ===")

if __name__ == "__main__":
    generate_daily_recommendations()
