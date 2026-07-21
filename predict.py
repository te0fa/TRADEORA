import sys
import os
import joblib
import traceback
import numpy as np
import pandas as pd
import pandas_ta as ta
from datetime import date, datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent / '.env')
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

def get_supabase() -> Client | None:
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            return create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
    return None

def calc_atr_14(candles: list) -> float:
    """Calculates 14-period Average True Range (ATR) from candles."""
    if len(candles) < 2:
        close = float(candles[-1]['close']) if candles else 1.0
        return max(close * 0.02, 0.01)

    highs = [float(c['high']) for c in candles]
    lows = [float(c['low']) for c in candles]
    closes = [float(c['close']) for c in candles]

    trs = []
    for i in range(1, len(candles)):
        tr = max(
            highs[i] - lows[i],
            abs(highs[i] - closes[i-1]),
            abs(lows[i] - closes[i-1])
        )
        trs.append(tr)

    recent_trs = trs[-14:] if len(trs) >= 14 else trs
    atr = sum(recent_trs) / len(recent_trs) if recent_trs else closes[-1] * 0.02
    return max(atr, closes[-1] * 0.005)

def extract_latest_features(candles: list) -> list | None:
    """
    Extracts 15 core features for the latest candle bar matching train_model.py:
    1. rsi
    2. macd_hist
    3. macd_raw
    4. dist_ema20
    5. dist_ema50
    6. atr_pct
    7. vol_ratio
    8. price_pos
    9. bb_width
    10. bb_pos
    11. stoch_rsi
    12. vol_spike
    13. dist_ath
    14. day_of_week
    15. market_regime
    """
    if len(candles) < 30:
        return None

    df = pd.DataFrame(candles)

    # 1. ADX for Market Regime
    adx_df = df.ta.adx(length=14)
    if adx_df is not None and not adx_df.empty:
        adx_list = adx_df['ADX_14'].tolist()
        plus_di = adx_df['DMP_14'].tolist()
        minus_di = adx_df['DMN_14'].tolist()
    else:
        adx_list = [0.0] * len(candles)
        plus_di = [0.0] * len(candles)
        minus_di = [0.0] * len(candles)

    closes = [float(c['close']) for c in candles]
    highs = [float(c['high']) for c in candles]
    lows = [float(c['low']) for c in candles]
    vols = [float(c.get('volume', 0) or 0) for c in candles]
    times = [c.get('time', None) for c in candles]

    # 2. Indicators
    def calc_rsi(cl, period=14):
        gains, losses = [], []
        for i in range(1, len(cl)):
            d = cl[i] - cl[i-1]
            gains.append(max(d, 0))
            losses.append(max(-d, 0))
        if len(gains) < period:
            return [None] * len(cl)
        ag = sum(gains[:period]) / period
        al = sum(losses[:period]) / period
        rsi_vals = [None] * len(cl)
        for i in range(period, len(cl)):
            if i > period:
                ag = (ag * (period - 1) + gains[i-1]) / period
                al = (al * (period - 1) + losses[i-1]) / period
            rs = ag / al if al != 0 else 100
            rsi_vals[i] = 100 - (100 / (1 + rs))
        return rsi_vals

    def calc_ema(cl, n):
        res = [None] * len(cl)
        k = 2 / (n + 1)
        for i in range(n - 1, len(cl)):
            if res[i-1] is None:
                res[i] = sum(cl[i-n+1:i+1]) / n
            else:
                res[i] = cl[i] * k + res[i-1] * (1 - k)
        return res

    rsi = calc_rsi(closes, 14)
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    ema20 = calc_ema(closes, 20)
    ema50 = calc_ema(closes, 50)
    ema200 = calc_ema(closes, 200)

    # BB
    bb_width = [None] * len(closes)
    bb_pos = [None] * len(closes)
    for i in range(19, len(closes)):
        window = closes[i-19:i+1]
        mean = sum(window) / 20
        std = (sum((x - mean) ** 2 for x in window) / 20) ** 0.5
        if std > 0:
            bb_width[i] = (std * 4) / mean * 100
            bb_pos[i] = (closes[i] - mean) / (std * 2)

    # Stoch RSI
    stoch_rsi = [None] * len(closes)
    for i in range(14, len(closes)):
        w = [x for x in rsi[i-14:i+1] if x is not None]
        if len(w) >= 14:
            min_r, max_r = min(w), max(w)
            stoch_rsi[i] = (rsi[i] - min_r) / (max_r - min_r) if (max_r - min_r) > 0 else 0.5

    # Focus on latest candle i = len(candles) - 1
    i = len(candles) - 1
    cl = closes[i]

    if None in [rsi[i], ema12[i], ema26[i], ema20[i], ema50[i], bb_width[i], bb_pos[i], stoch_rsi[i]]:
        return None

    macd_raw = ema12[i] - ema26[i]
    macd_prev = ((ema12[i-1] or 0) - (ema26[i-1] or 0))
    macd_hist = macd_raw - macd_prev

    trs = [max(highs[j]-lows[j], abs(highs[j]-closes[j-1]), abs(lows[j]-closes[j-1])) for j in range(max(1, i-13), i+1)]
    atr = sum(trs) / len(trs) if trs else 0.001

    avg_vol = sum(vols[i-13:i+1]) / 14 if i >= 13 else 1
    vol_ratio = vols[i] / avg_vol if avg_vol > 0 else 1
    vol_spike = 1 if vol_ratio >= 3 else 0

    lookback_52 = min(i, 252)
    ath_52 = max(highs[i-lookback_52:i+1])
    dist_ath = (cl - ath_52) / ath_52 * 100

    day_of_week = 0
    if times[i]:
        try:
            if isinstance(times[i], (int, float)):
                dt = datetime.fromtimestamp(times[i])
                day_of_week = dt.weekday()
            elif hasattr(times[i], 'weekday'):
                day_of_week = times[i].weekday()
            elif isinstance(times[i], str):
                dt = datetime.fromisoformat(times[i].split('T')[0])
                day_of_week = dt.weekday()
        except:
            pass
    day_of_week = (day_of_week + 1) % 7

    candle_range = highs[i] - lows[i]
    price_pos = (cl - lows[i]) / (candle_range + 0.001)

    adx_val = adx_list[i] if (i < len(adx_list) and adx_list[i] is not None and not np.isnan(adx_list[i])) else 0.0
    pdi_val = plus_di[i] if (i < len(plus_di) and plus_di[i] is not None and not np.isnan(plus_di[i])) else 0.0
    ndi_val = minus_di[i] if (i < len(minus_di) and minus_di[i] is not None and not np.isnan(minus_di[i])) else 0.0

    ema_crossover = False
    if i >= 15:
        diffs = []
        for j in range(i-15, i+1):
            if ema50[j] is not None and ema200[j] is not None:
                diffs.append(ema50[j] - ema200[j])
        if len(diffs) >= 2:
            signs = [np.sign(d) for d in diffs]
            if len(set(signs)) > 1 or 0 in signs:
                ema_crossover = True
            avg_diff = sum(abs(d) for d in diffs) / len(diffs)
            if avg_diff / max(cl, 1.0) < 0.002:
                ema_crossover = True

    if adx_val > 25:
        regime = 1.0 if pdi_val > ndi_val else -1.0
    elif adx_val <= 20 or ema_crossover:
        regime = 0.0
    else:
        regime = 0.0

    return [
        rsi[i],
        macd_hist,
        macd_raw,
        (cl - ema20[i]) / ema20[i] * 100,
        (cl - ema50[i]) / ema50[i] * 100,
        atr / cl * 100,
        min(vol_ratio, 5),
        price_pos,
        bb_width[i],
        bb_pos[i],
        stoch_rsi[i],
        vol_spike,
        dist_ath,
        day_of_week,
        regime
    ]

def save_prediction(company_id: str, timeframe: str, probability: float, signal: str = None):
    """Saves or updates prediction in ml_predictions table in Supabase."""
    supabase = get_supabase()
    if not supabase:
        print("Warning: Supabase credentials missing. Prediction not saved to DB.")
        return

    if signal is None:
        if probability >= 0.65:
            signal = 'BUY'
        elif probability <= 0.35:
            signal = 'SELL'
        else:
            signal = 'NEUTRAL'

    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        today_iso = date.today().isoformat()
        supabase.table('ml_predictions').upsert({
            'company_id': company_id,
            'timeframe': timeframe,
            'probability': probability,
            'signal_type': signal,
            'predicted_date': today_iso,
            'predicted_at': now_iso,
        }, on_conflict='company_id,timeframe,predicted_date').execute()
    except Exception as e:
        print(f"Error saving prediction to Supabase for company {company_id}: {e}")

def predict_all_companies(timeframe: str = '1d'):
    """
    Batch runs ML predictions for all active companies (~314 stocks),
    saves results in ml_predictions, and populates recommended_trades
    for high-probability signals (> 0.65) using ATR-based TP/SL targets.
    """
    print(f"\n==================================================", flush=True)
    print(f"   STARTING DAILY ML PREDICTIONS PIPELINE [{timeframe}]   ", flush=True)
    print(f"==================================================", flush=True)

    sb = get_supabase()
    if not sb:
        print("Error: Could not connect to Supabase database.")
        return

    # 1. Load model and scaler
    model_path = Path('models') / f'model_{timeframe}.pkl'
    scaler_path = Path('models') / f'scaler_{timeframe}.pkl'

    if not model_path.exists() or not scaler_path.exists():
        print(f"Error: Model or Scaler file not found for timeframe {timeframe} in models/")
        return

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    expected_n_features = getattr(scaler, 'n_features_in_', 15)

    # 2. Fetch all companies
    companies = sb.table('companies').select('id,symbol,sector,name_ar,name_en').execute().data or []
    if not companies:
        print("No companies found in database.")
        return

    print(f"Loaded {len(companies)} companies from Supabase.", flush=True)

    # 3. Batch fetch recent market prices for all companies (last 120 days is plenty for indicators)
    print("Fetching historical price candles for all stocks...", flush=True)
    from datetime import timedelta
    cutoff_date = (date.today() - timedelta(days=120)).isoformat()

    all_prices = []
    page_size = 1000
    start = 0
    while True:
        res = sb.table('market_prices')\
            .select('company_id,open_price,high_price,low_price,close_price,volume,price_date')\
            .gte('price_date', cutoff_date)\
            .range(start, start + page_size - 1)\
            .order('price_date').execute()
        data = res.data or []
        if not data:
            break
        all_prices.extend(data)
        if len(data) < page_size:
            break
        start += page_size

    prices_by_co = {}
    for r in all_prices:
        cid = r['company_id']
        if not r.get('close_price'):
            continue
        prices_by_co.setdefault(cid, []).append({
            'open': float(r['open_price'] or r['close_price']),
            'high': float(r['high_price'] or r['close_price']),
            'low': float(r['low_price'] or r['close_price']),
            'close': float(r['close_price']),
            'volume': float(r['volume'] or 0),
            'time': r['price_date']
        })

    predictions_to_save = []
    high_prob_signals = []
    recommended_trades_count = 0
    now_iso = datetime.now(timezone.utc).isoformat()
    today_iso = date.today().isoformat()

    for co in companies:
        cid, sym = co['id'], co['symbol']
        candles = prices_by_co.get(cid, [])
        if len(candles) < 30:
            continue

        candles.sort(key=lambda x: str(x['time']))
        feat_vector = extract_latest_features(candles)
        if not feat_vector:
            continue

        if len(feat_vector) < expected_n_features:
            feat_vector.extend([0.0] * (expected_n_features - len(feat_vector)))
        elif len(feat_vector) > expected_n_features:
            feat_vector = feat_vector[:expected_n_features]

        # Score probability
        X_scaled = scaler.transform([feat_vector])
        prob = float(model.predict_proba(X_scaled)[0][1])

        signal = 'BUY' if prob >= 0.65 else ('SELL' if prob <= 0.35 else 'NEUTRAL')
        predictions_to_save.append({
            'company_id': cid,
            'timeframe': timeframe,
            'probability': prob,
            'signal_type': signal,
            'predicted_date': today_iso,
            'predicted_at': now_iso,
        })

        # Check for High-Probability Signal (>= 0.65) -> Generate Trade Recommendation
        if prob >= 0.65:
            latest_close = float(candles[-1]['close'])
            entry_price = round(latest_close, 2)
            if entry_price <= 0:
                continue

            atr = calc_atr_14(candles)

            # Limit ATR relative to entry price
            atr_pct_of_price = atr / entry_price
            if atr_pct_of_price > 0.12:
                atr = entry_price * 0.05

            sl = round(entry_price - (1.5 * atr), 2)
            tp1 = round(entry_price + (1.5 * atr), 2)
            tp2 = round(entry_price + (3.0 * atr), 2)

            # Safeguards
            if sl >= entry_price or sl <= 0:
                sl = round(entry_price * 0.93, 2)
            if tp1 <= entry_price:
                tp1 = round(entry_price * 1.03, 2)
            if tp2 <= tp1:
                tp2 = round(entry_price * 1.06, 2)

            # Validate Risk / Reward ratio (using average TP matching route.ts API)
            risk = entry_price - sl
            if risk > 0:
                reward = ((tp1 + tp2) / 2.0) - entry_price
                rr = reward / risk
                if rr > 5.0 or rr < 1.2:
                    continue
            else:
                continue

            trade_rec = {
                'company_id': cid,
                'symbol': sym,
                'direction': 'buy',
                'entry_price': entry_price,
                'tp1': tp1,
                'tp2': tp2,
                'sl': sl,
                'timeframe': timeframe,
                'status': 'active',
                'ml_probability': round(prob, 4),
                'features_snapshot': {
                    'probability': round(prob, 4),
                    'atr_14': round(atr, 4),
                    'rsi_14': round(feat_vector[0], 2) if feat_vector else None,
                    'market_regime': feat_vector[14] if len(feat_vector) > 14 else 0.0
                },
                'recommended_at': datetime.now(timezone.utc).isoformat()
            }
            high_prob_signals.append(trade_rec)

    if predictions_to_save:
        try:
            sb.table('ml_predictions').upsert(predictions_to_save, on_conflict='company_id,timeframe,predicted_date').execute()
            saved_predictions_count = len(predictions_to_save)
            print(f"Batch saved {saved_predictions_count} predictions to ml_predictions.", flush=True)
        except Exception as e:
            print(f"Error bulk saving predictions to Supabase: {e}", flush=True)

    # Insert / Upsert High-Probability Trades into recommended_trades
    if high_prob_signals:
        try:
            active_trades_data = sb.table('recommended_trades')\
                .select('id,symbol')\
                .eq('status', 'active')\
                .execute().data or []
            active_trades_map = {t['symbol']: t['id'] for t in active_trades_data}

            for rec in high_prob_signals:
                existing_id = active_trades_map.get(rec['symbol'])
                if not existing_id:
                    sb.table('recommended_trades').insert(rec).execute()
                    recommended_trades_count += 1
                    print(f"  [RECOMMENDATION] {rec['symbol']} | Prob: {rec['ml_probability']:.2%} | Entry: {rec['entry_price']} | TP1: {rec['tp1']} | SL: {rec['sl']}", flush=True)
                else:
                    sb.table('recommended_trades').update({
                        'entry_price': rec['entry_price'],
                        'tp1': rec['tp1'],
                        'tp2': rec['tp2'],
                        'sl': rec['sl'],
                        'ml_probability': rec['ml_probability'],
                        'features_snapshot': rec['features_snapshot']
                    }).eq('id', existing_id).execute()
                    recommended_trades_count += 1
                    print(f"  [UPDATED REC] {rec['symbol']} | Prob: {rec['ml_probability']:.2%} | Entry: {rec['entry_price']} | TP1: {rec['tp1']} | SL: {rec['sl']}", flush=True)
        except Exception as e:
            print(f"Error processing trade recommendations: {e}", flush=True)

    print("\n==================================================", flush=True)
    print("      DAILY ML PREDICTIONS SUMMARY REPORT         ", flush=True)
    print("==================================================", flush=True)
    print(f"Total Companies Processed  : {len(companies)}")
    print(f"Saved to ml_predictions    : {saved_predictions_count}")
    print(f"High-Prob Signals (> 0.65) : {len(high_prob_signals)}")
    print(f"Recommended Trades Created : {recommended_trades_count}")
    print("==================================================\n", flush=True)

if __name__ == "__main__":
    try:
        # Check CLI arguments
        if len(sys.argv) >= 3 and not sys.argv[1].startswith('--'):
            # Legacy single CLI prediction call
            tf = sys.argv[1]
            features = [float(x) for x in sys.argv[2].split(',')]
            company_id = sys.argv[3] if len(sys.argv) > 3 else None

            model = joblib.load(f'models/model_{tf}.pkl')
            scaler = joblib.load(f'models/scaler_{tf}.pkl')
            expected_n = getattr(scaler, 'n_features_in_', 15)

            if len(features) < expected_n:
                features.extend([0.0] * (expected_n - len(features)))
            elif len(features) > expected_n:
                features = features[:expected_n]

            X = scaler.transform([features])
            prob = float(model.predict_proba(X)[0][1])
            print(f"{prob:.4f}")

            if company_id:
                save_prediction(company_id, tf, prob)
        else:
            # Full Batch Daily Predictions Mode
            tf = '1d'
            if len(sys.argv) >= 2 and not sys.argv[1].startswith('--'):
                tf = sys.argv[1]
            predict_all_companies(tf)

    except Exception as e:
        print("0.5000")
        try:
            os.makedirs('models', exist_ok=True)
            with open('models/prediction_errors.log', 'a', encoding='utf-8') as f:
                f.write("--- Exception occurred in predict.py ---\n")
                f.write(f"Args: {sys.argv}\n")
                f.write(f"Error: {str(e)}\n")
                traceback.print_exc(file=f)
                f.write("\n")
        except Exception:
            pass
        sys.exit(0)
