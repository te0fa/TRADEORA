import os
import sys
import json
import argparse
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client
from xgboost import XGBClassifier
from sklearn.model_selection import TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score

from generate_daily_recommendations import (
    calculate_macd_standard,
    calc_rsi,
    calc_ema
)

# Load environment
load_dotenv(dotenv_path=Path(__file__).parent / '.env')
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

sb = create_client(url, key)

# Label configuration per timeframe
TIMEFRAME_CONFIG = {
    '15m': {
        'source': 'tradingview_15m',
        'horizon': 16,        # 16 x 15m = 4 trading hours
        'buy_threshold': 0.01, # +1.0%
        'sell_threshold': -0.0075, # -0.75%
    },
    '1h': {
        'source': 'tradingview_1h',
        'horizon': 8,         # 8 x 1h = 1 trading day
        'buy_threshold': 0.02, # +2.0%
        'sell_threshold': -0.015, # -1.5%
    },
    '4h': {
        'source': 'tradingview_4h',
        'horizon': 3,         # 3 x 4h = 1.5 trading days
        'buy_threshold': 0.03, # +3.0%
        'sell_threshold': -0.02, # -2.0%
    }
}

def build_label(closes: list,
                i: int,
                horizon: int,
                buy_threshold: float,
                sell_threshold: float) -> int:
    """
    Label = 1 (BUY) if stock returns >= buy_threshold within horizon candles
    Label = 0 (SELL/HOLD) if stock returns <= sell_threshold within horizon candles
    Label = -1 (Gray zone / ambiguous) -> Excluded
    """
    if i + horizon >= len(closes):
        return -1

    future_return = (closes[i + horizon] - closes[i]) / closes[i]

    if future_return >= buy_threshold:
        return 1
    elif future_return <= sell_threshold:
        return 0
    else:
        return -1

def build_clean_intraday_candles(all_rows_by_co: dict) -> dict:
    """
    Filters out flat candles (Mubasher artifacts), zero volume, and bad price geometry.
    Groups and sorts by snapshot_time per company.
    """
    clean_candles_by_co = {}

    for cid, rows in all_rows_by_co.items():
        # Deduplicate by snapshot_time
        time_map = {}
        for r in rows:
            st = r['snapshot_time']
            if st not in time_map:
                time_map[st] = r

        sorted_rows = sorted(time_map.values(), key=lambda x: x['snapshot_time'])

        candles = []
        for row in sorted_rows:
            h = float(row.get('high_price') or 0)
            l = float(row.get('low_price') or 0)
            c = float(row.get('price') or row.get('close_price') or 0)
            o = float(row.get('open_price') or c)
            v = float(row.get('volume') or 0)

            # Filter out flat candles & zero volume
            if h == l == c and c > 0:
                continue
            if v <= 0:
                continue

            # Quality filter
            if c <= 0 or h < l or c > h * 1.5:
                continue

            candles.append({
                'open': o if o > 0 else c,
                'high': h if h > 0 else c,
                'low': l if l > 0 else c,
                'close': c,
                'volume': v,
                'time': row['snapshot_time']
            })

        clean_candles_by_co[cid] = candles

    return clean_candles_by_co

def extract_features_for_training(candles: list) -> list:
    """
    Extracts 15 technical features matching generate_daily_recommendations.py / train_model_v2.py
    """
    df = pd.DataFrame(candles)
    adx_df = df.ta.adx(length=14) if hasattr(df, 'ta') else None
    if adx_df is not None and not adx_df.empty and 'ADX_14' in adx_df:
        adx_list = adx_df['ADX_14'].tolist()
        plus_di = adx_df['DMP_14'].tolist()
        minus_di = adx_df['DMN_14'].tolist()
    else:
        adx_list = [0.0] * len(candles)
        plus_di = [0.0] * len(candles)
        minus_di = [0.0] * len(candles)

    closes = [c['close'] for c in candles]
    highs  = [c['high']  for c in candles]
    lows   = [c['low']   for c in candles]
    vols   = [c.get('volume', 0) for c in candles]

    rsi   = calc_rsi(closes, 14)
    ema12 = calc_ema(closes, 12)
    ema26 = calc_ema(closes, 26)
    ema20 = calc_ema(closes, 20)
    ema50 = calc_ema(closes, 50)

    # Bollinger Bands
    def calc_bb(closes, n=20):
        bb_width = [None]*len(closes)
        bb_pos   = [None]*len(closes)
        for i in range(n-1, len(closes)):
            window = closes[i-n+1:i+1]
            mean = sum(window)/n
            std  = (sum((x-mean)**2 for x in window)/n)**0.5
            if std > 0:
                bb_width[i] = (std*4) / mean * 100
                bb_pos[i]   = (closes[i]-mean) / (std*2)
        return bb_width, bb_pos

    # Stochastic RSI
    def calc_stoch_rsi(rsi_vals, period=14):
        stoch = [None]*len(rsi_vals)
        for i in range(period, len(rsi_vals)):
            window = [x for x in rsi_vals[i-period:i+1] if x is not None]
            if len(window) < period:
                continue
            min_r, max_r = min(window), max(window)
            if max_r - min_r > 0:
                stoch[i] = (rsi_vals[i]-min_r)/(max_r-min_r)
            else:
                stoch[i] = 0.5
        return stoch

    bb_width, bb_pos = calc_bb(closes)
    stoch_rsi = calc_stoch_rsi(rsi)

    rows = []
    for i in range(50, len(candles)):
        cl = closes[i]
        if None in [rsi[i], ema12[i], ema26[i], ema20[i], ema50[i], bb_width[i], bb_pos[i], stoch_rsi[i]]:
            continue

        closes_list = closes[:i+1]
        macd_result = calculate_macd_standard(closes_list)
        if macd_result['histogram'] is None:
            continue

        macd_hist = macd_result['histogram']
        macd_raw  = macd_result['macd_line']

        trs = [max(highs[j]-lows[j], abs(highs[j]-closes[j-1]), abs(lows[j]-closes[j-1])) for j in range(max(1, i-13), i+1)]
        atr = sum(trs)/len(trs) if trs else (cl * 0.02)

        avg_vol   = sum(vols[i-13:i+1])/14 if i >= 13 else 1
        vol_ratio = vols[i]/avg_vol if avg_vol > 0 else 1
        vol_spike = 1 if vol_ratio >= 3 else 0

        lookback_ath = min(i, 52)
        ath = max(highs[i-lookback_ath:i+1])
        dist_ath = (cl - ath) / ath * 100

        dt_c = None
        t_val = candles[i].get('time')
        if isinstance(t_val, str):
            try:
                dt_c = datetime.fromisoformat(t_val.replace('Z', '+00:00'))
            except:
                pass
        day_of_week = (dt_c.weekday() + 1) % 7 if dt_c else 0

        candle_range = highs[i] - lows[i]
        price_pos = (cl - lows[i]) / (candle_range + 0.001)

        adx_val = adx_list[i] if (i < len(adx_list) and adx_list[i] is not None and not np.isnan(adx_list[i])) else 0.0
        pdi_val = plus_di[i] if (i < len(plus_di) and plus_di[i] is not None and not np.isnan(plus_di[i])) else 0.0
        ndi_val = minus_di[i] if (i < len(minus_di) and minus_di[i] is not None and not np.isnan(minus_di[i])) else 0.0

        regime = 1.0 if (adx_val > 25 and pdi_val > ndi_val) else (-1.0 if adx_val > 25 else 0.0)

        feat_row = [
            rsi[i], macd_hist, macd_raw,
            (cl-ema20[i])/ema20[i]*100, (cl-ema50[i])/ema50[i]*100,
            atr/cl*100, min(vol_ratio, 5), price_pos,
            bb_width[i], bb_pos[i], stoch_rsi[i], vol_spike,
            dist_ath, day_of_week, regime
        ]
        rows.append({'idx': i, 'feat_row': feat_row})

    return rows

def build_training_dataset(timeframe: str):
    cfg = TIMEFRAME_CONFIG[timeframe]
    source_name = cfg['source']

    print(f"\n[Dataset] Fetching active companies for timeframe '{timeframe}' (source={source_name})...", flush=True)
    companies = sb.table("companies").select("id, symbol").eq("status", "active").execute().data or []
    active_cids = {co['id'] for co in companies}
    print(f"[Dataset] Loaded {len(companies)} active companies.", flush=True)

    print(f"[Dataset] Fetching intraday_snapshots bulk data...", flush=True)
    all_prices = []
    page_size = 1000
    start = 0
    while True:
        res = sb.table('intraday_snapshots') \
            .select('company_id, open_price, high_price, low_price, price, volume, snapshot_time, source') \
            .eq('source', source_name) \
            .range(start, start + page_size - 1) \
            .execute()
        data = res.data or []
        if not data:
            break
        all_prices.extend(data)
        start += len(data)
        if len(data) < page_size:
            break
        if len(all_prices) % 10000 == 0:
            print(f"  Fetched {len(all_prices)} rows so far...", flush=True)

    print(f"[Dataset] Fetched {len(all_prices)} total raw candles. Grouping by company...", flush=True)
    all_rows_by_co = {}
    for r in all_prices:
        cid = r['company_id']
        if cid in active_cids and r.get('price'):
            all_rows_by_co.setdefault(cid, []).append(r)

    clean_candles_by_co = build_clean_intraday_candles(all_rows_by_co)

    X_rows, y_rows = [], []
    stock_count = 0

    for cid, candles in clean_candles_by_co.items():
        if len(candles) < 60:
            continue

        stock_count += 1
        extracted = extract_features_for_training(candles)
        closes = [c['close'] for c in candles]

        for item in extracted:
            i = item['idx']
            label = build_label(
                closes, i,
                horizon=cfg['horizon'],
                buy_threshold=cfg['buy_threshold'],
                sell_threshold=cfg['sell_threshold']
            )

            if label == -1:
                continue

            X_rows.append(item['feat_row'])
            y_rows.append(label)

    print(f"[Dataset] Clean Dataset Built for {timeframe}: {len(X_rows)} samples across {stock_count} stocks.", flush=True)
    return np.array(X_rows), np.array(y_rows)

def train_and_validate(timeframe: str):
    cfg = TIMEFRAME_CONFIG[timeframe]
    X, y = build_training_dataset(timeframe)

    if len(X) < 100:
        print(f"ERROR: Insufficient dataset ({len(X)} samples) for training timeframe {timeframe}.", flush=True)
        return False

    buy_count = int(y.sum())
    sell_count = len(y) - buy_count
    buy_pct = (buy_count / len(y)) * 100
    sell_pct = (sell_count / len(y)) * 100

    print(f"\n══ Class Distribution Check ({timeframe}) ══", flush=True)
    print(f"Total Samples: {len(X)}", flush=True)
    print(f"BUY Signals  (1): {buy_count} ({buy_pct:.1f}%)", flush=True)
    print(f"SELL Signals (0): {sell_count} ({sell_pct:.1f}%)", flush=True)

    # Calculate scale_pos_weight to handle class imbalance and prevent BUY bias
    scale_pos_weight = sell_count / max(buy_count, 1)

    tscv = TimeSeriesSplit(n_splits=5)
    oof_preds = np.zeros(len(X))
    oof_probs = np.zeros(len(X))

    feature_names = [
        'rsi', 'macd_hist', 'macd_raw',
        'dist_ema20', 'dist_ema50',
        'atr_pct', 'vol_ratio', 'price_pos',
        'bb_width', 'bb_pos', 'stoch_rsi', 'vol_spike',
        'dist_ath', 'day_of_week', 'market_regime'
    ]

    feature_importances_list = []
    test_indices = []

    print(f"\n══ TimeSeriesSplit Cross Validation (5 Folds - {timeframe}) ══", flush=True)
    fold = 0
    for train_idx, test_idx in tscv.split(X):
        fold += 1
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]

        scaler_fold = StandardScaler()
        X_train_scaled = scaler_fold.fit_transform(X_train)
        X_test_scaled  = scaler_fold.transform(X_test)

        model_fold = XGBClassifier(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=scale_pos_weight,
            eval_metric='logloss',
            random_state=42
        )
        model_fold.fit(X_train_scaled, y_train)

        preds = model_fold.predict(X_test_scaled)
        probs = model_fold.predict_proba(X_test_scaled)[:, 1]

        oof_preds[test_idx] = preds
        oof_probs[test_idx] = probs
        test_indices.extend(test_idx)

        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, zero_division=0)
        rec = recall_score(y_test, preds, zero_division=0)
        feature_importances_list.append(model_fold.feature_importances_)

        print(f" Fold {fold}: Acc = {acc*100:.2f}%, BUY Prec = {prec*100:.2f}%, BUY Rec = {rec*100:.2f}%", flush=True)

    test_eval_idx = np.array(test_indices)
    test_acc = accuracy_score(y[test_eval_idx], oof_preds[test_eval_idx])
    test_prec = precision_score(y[test_eval_idx], oof_preds[test_eval_idx], zero_division=0)
    test_rec = recall_score(y[test_eval_idx], oof_preds[test_eval_idx], zero_division=0)

    avg_importances = np.mean(feature_importances_list, axis=0)
    importance_ranking = sorted(zip(feature_names, avg_importances), key=lambda x: x[1], reverse=True)

    print(f"\n══ Final Model Evaluation Metrics ({timeframe}) ══", flush=True)
    print(f"1. Test Accuracy: {test_acc*100:.2f}% (Threshold > 52%)", flush=True)
    print(f"2. BUY Precision: {test_prec*100:.2f}% (Threshold > 50%)", flush=True)
    print(f"3. BUY Recall:    {test_rec*100:.2f}% (Threshold > 40%)", flush=True)
    print(f"4. BUY Ratio:     {buy_pct:.1f}% (Acceptable 40%-60%)", flush=True)

    # Final Fit
    scaler_final = StandardScaler()
    X_scaled_full = scaler_final.fit_transform(X)

    model_final = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        scale_pos_weight=scale_pos_weight,
        eval_metric='logloss',
        random_state=42
    )
    model_final.fit(X_scaled_full, y)

    os.makedirs('models', exist_ok=True)
    model_path  = f'models/model_{timeframe}_v2.pkl'
    scaler_path = f'models/scaler_{timeframe}_v2.pkl'
    meta_path   = f'models/model_{timeframe}_v2_metadata.json'

    joblib.dump(model_final, model_path)
    joblib.dump(scaler_final, scaler_path)

    metadata = {
        "timeframe": timeframe,
        "version": "2.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "macd_version": "standard (MACD - Signal)",
        "data_sources": [cfg['source']],
        "flat_candles_excluded": True,
        "label_parameters": {
            "horizon_candles": cfg['horizon'],
            "buy_threshold": cfg['buy_threshold'],
            "sell_threshold": cfg['sell_threshold']
        },
        "features": feature_names,
        "training_samples": len(X),
        "class_distribution": {
            "buy_pct": round(buy_pct, 2),
            "sell_pct": round(sell_pct, 2)
        },
        "test_accuracy": round(float(test_acc), 4),
        "test_precision": round(float(test_prec), 4),
        "test_recall": round(float(test_rec), 4),
        "feature_importance_ranking": [
            {"feature": name, "importance": round(float(imp), 4)} for name, imp in importance_ranking
        ]
    }

    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Model {timeframe} v2 Saved Successfully:", flush=True)
    print(f"   Model:  {model_path}", flush=True)
    print(f"   Scaler: {scaler_path}", flush=True)
    print(f"   Meta:   {meta_path}", flush=True)
    return True

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train Intraday Model v2")
    parser.add_argument('--timeframe', choices=['1h', '4h', '15m'], default='1h', help="Timeframe to train (1h, 4h, 15m)")
    args = parser.parse_args()

    train_and_validate(args.timeframe)
