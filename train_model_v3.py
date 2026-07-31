"""
Tradeora Model v3 Training Script – 21 Features
Extends v2 (15 features) with 6 new engineered signals:
  16. wyckoff_score      – Wyckoff accumulation score (0-1)
  17. smart_money_norm   – Institutional vol/spread score (0-1)
  18. ict_fvg            – Bullish FVG present (0/1)
  19. ict_ob             – Bullish OB present (0/1)
  20. elliott_momentum   – 15-bar return normalized proxy (-1 to +1)
  21. fundamental_norm   – Fundamental health score (0-1)

Strategy:
- Fetch ALL prices with pagination (same as v2) -> ensures 56k+ samples
- Compute 6 new features once per stock on the FULL candle set
  (tail window), then broadcast as a constant signal for all training
  rows of that stock. This avoids per-candle engine overhead while
  still teaching the model cross-company patterns.
"""

import os
import json
import sys
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
from sklearn.metrics import accuracy_score, precision_score

from generate_daily_recommendations import (
    calculate_macd_standard,
    calc_rsi,
    calc_ema
)
from services.ict_smc_engine import ict_smc_engine
from services.wyckoff_engine import get_wyckoff_confluence_score
from services.smart_money_engine import smart_money_engine
from services.fundamental_engine import calculate_fundamental_score

load_dotenv(dotenv_path=Path(__file__).parent / '.env')
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb  = create_client(url, key)

ALLOWED_SOURCES = ['tradingview_1d', 'egx_bulletin', 'yahoo_historical', 'tradingview']
SOURCE_PRIO     = ['egx_bulletin', 'tradingview_1d', 'yahoo_historical', 'tradingview']
MODEL_OUT       = 'models/model_1d_v3.pkl'
SCALER_OUT      = 'models/scaler_1d_v3.pkl'
META_OUT        = 'models/model_v3_metadata.json'

FEATURE_NAMES = [
    # ── original 15 ───────────────────────────────────
    'rsi', 'macd_hist', 'macd_raw',
    'dist_ema20', 'dist_ema50',
    'atr_pct', 'vol_ratio', 'price_pos',
    'bb_width', 'bb_pos', 'stoch_rsi', 'vol_spike',
    'dist_ath', 'day_of_week', 'market_regime',
    # ── 6 new engineered signals ──────────────────────
    'wyckoff_score', 'smart_money_norm',
    'ict_fvg', 'ict_ob',
    'elliott_momentum', 'fundamental_norm',
]

# ─────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────

def build_label(closes, i, horizon=15, buy=0.04, sell=-0.03):
    if i + horizon >= len(closes):
        return -1
    ret = (closes[i + horizon] - closes[i]) / closes[i]
    if ret >= buy:  return 1
    if ret <= sell: return 0
    return -1


def calc_bb(closes, n=20):
    bb_w = [None] * len(closes)
    bb_p = [None] * len(closes)
    for i in range(n - 1, len(closes)):
        w    = closes[i - n + 1:i + 1]
        mu   = sum(w) / n
        std  = (sum((x - mu) ** 2 for x in w) / n) ** 0.5
        if std > 0:
            bb_w[i] = (std * 4) / mu * 100
            bb_p[i] = (closes[i] - mu) / (std * 2)
    return bb_w, bb_p


def calc_stoch_rsi(rsi_vals, period=14):
    s = [None] * len(rsi_vals)
    for i in range(period, len(rsi_vals)):
        w = [x for x in rsi_vals[i - period:i + 1] if x is not None]
        if len(w) < period:
            continue
        lo, hi = min(w), max(w)
        s[i] = (rsi_vals[i] - lo) / (hi - lo) if hi - lo > 0 else 0.5
    return s


# ─────────────────────────────────────────────────────────────────────
# New feature computation (once per stock, tail window)
# ─────────────────────────────────────────────────────────────────────

def compute_new_features_for_stock(candles: list, fund_data: dict) -> list:
    """
    Computes 6 new engineered features using the LAST 40 candles only.
    Returns a 6-element list that is broadcast to all training rows.
    """
    tail = candles[-40:]
    df   = pd.DataFrame(tail)

    # 16. Wyckoff accumulation score
    try:
        wyck  = get_wyckoff_confluence_score(df)
        boost = wyck.get('total_boost', 0.0)
        wyckoff_score = min(max((boost + 0.20) / 0.40, 0.0), 1.0)  # map [-0.2, +0.2] → [0, 1]
    except Exception:
        wyckoff_score = 0.5

    # 17. Smart money normalized score
    try:
        sm   = smart_money_engine.calculate_smart_money_score(df)
        smart_money_norm = sm.get('smart_money_score', 50.0) / 100.0
    except Exception:
        smart_money_norm = 0.5

    # 18 & 19. ICT FVG / OB
    try:
        ict     = ict_smc_engine.analyze_ict_smc_patterns(df)
        ict_fvg = 1.0 if ict.get('fvg_detected') else 0.0
        ict_ob  = 1.0 if ict.get('ob_detected')  else 0.0
    except Exception:
        ict_fvg = ict_ob = 0.0

    # 20. Elliott momentum proxy – 15-bar return normalized to [-1, 1]
    closes = [c['close'] for c in candles]
    if len(closes) >= 16:
        ret15 = (closes[-1] - closes[-16]) / closes[-16] * 100
        elliott_mom = min(max(ret15 / 20.0, -1.0), 1.0)
    else:
        elliott_mom = 0.0

    # 21. Fundamental score normalized
    try:
        fund_info     = calculate_fundamental_score(fund_data or {})
        fundamental_n = fund_info.get('total_score', 50.0) / 100.0
    except Exception:
        fundamental_n = 0.5

    return [wyckoff_score, smart_money_norm, ict_fvg, ict_ob, elliott_mom, fundamental_n]


# ─────────────────────────────────────────────────────────────────────
# Feature extraction (15 original) – same logic as v2
# ─────────────────────────────────────────────────────────────────────

def extract_features_v2(candles: list) -> list:
    closes = [c['close'] for c in candles]
    highs  = [c['high']  for c in candles]
    lows   = [c['low']   for c in candles]
    vols   = [c.get('volume', 0) for c in candles]

    rsi_vals  = calc_rsi(closes, 14)
    ema12     = calc_ema(closes, 12)
    ema26     = calc_ema(closes, 26)
    ema20     = calc_ema(closes, 20)
    ema50     = calc_ema(closes, 50)
    bb_w, bb_p = calc_bb(closes)
    stoch     = calc_stoch_rsi(rsi_vals)

    rows = []
    for i in range(50, len(candles)):
        cl = closes[i]
        if None in [rsi_vals[i], ema12[i], ema26[i], ema20[i], ema50[i],
                    bb_w[i], bb_p[i], stoch[i]]:
            continue

        macd = calculate_macd_standard(closes[:i + 1])
        if macd['histogram'] is None:
            continue

        trs    = [max(highs[j] - lows[j],
                      abs(highs[j] - closes[j - 1]),
                      abs(lows[j] - closes[j - 1])) for j in range(max(1, i - 13), i + 1)]
        atr    = sum(trs) / len(trs) if trs else cl * 0.02
        avg_v  = sum(vols[i - 13:i + 1]) / 14 if i >= 13 else 1
        vol_r  = vols[i] / avg_v if avg_v > 0 else 1

        lb52   = min(i, 252)
        ath    = max(highs[i - lb52:i + 1])
        d_ath  = (cl - ath) / ath * 100

        t_val  = candles[i].get('time', '')
        dt_c   = None
        if isinstance(t_val, str):
            try:
                dt_c = datetime.fromisoformat(t_val)
            except Exception:
                pass
        dow    = (dt_c.weekday() + 1) % 7 if dt_c else 0

        c_rng  = highs[i] - lows[i]
        pp     = (cl - lows[i]) / (c_rng + 0.001)

        # Simple market regime from MACD cross
        regime = 1.0 if (macd['macd_line'] and macd['signal_line'] and
                         macd['macd_line'] > macd['signal_line']) else -1.0

        rows.append({'idx': i, 'feat15': [
            rsi_vals[i], macd['histogram'], macd['macd_line'],
            (cl - ema20[i]) / ema20[i] * 100, (cl - ema50[i]) / ema50[i] * 100,
            atr / cl * 100, min(vol_r, 5), pp,
            bb_w[i], bb_p[i], stoch[i],
            1 if vol_r >= 3 else 0,
            d_ath, dow, regime
        ]})
    return rows


# ─────────────────────────────────────────────────────────────────────
# Data loading with full pagination (same as v2)
# ─────────────────────────────────────────────────────────────────────

def load_all_prices() -> list:
    all_prices = []
    page_size  = 1000
    start      = 0
    print("Fetching all market prices (paginated)...", flush=True)
    while True:
        res  = sb.table('market_prices') \
                 .select('company_id, open_price, high_price, low_price, close_price, volume, price_date, source') \
                 .in_('source', ALLOWED_SOURCES) \
                 .range(start, start + page_size - 1) \
                 .order('id').execute()
        data = res.data or []
        if not data:
            break
        all_prices.extend(data)
        print(f"  ...fetched {len(all_prices)} rows so far", flush=True)
        if len(data) < page_size:
            break
        start += page_size
    return all_prices


def build_candles_for_company(rows: list) -> list:
    """Deduplicates by date (source priority), filters zero-close."""
    day_map = {}
    for r in rows:
        d = r['price_date']
        if d not in day_map:
            day_map[d] = r
        else:
            cp = SOURCE_PRIO.index(day_map[d]['source']) if day_map[d]['source'] in SOURCE_PRIO else 99
            np_ = SOURCE_PRIO.index(r['source']) if r['source'] in SOURCE_PRIO else 99
            if np_ < cp:
                day_map[d] = r

    candles = []
    for r in sorted(day_map.values(), key=lambda x: x['price_date']):
        c = float(r.get('close_price') or 0)
        if c <= 0:
            continue
        candles.append({
            'time':        r['price_date'],
            'open':        float(r.get('open_price') or c),
            'high':        float(r.get('high_price') or c),
            'low':         float(r.get('low_price') or c),
            'close':       c,
            'volume':      float(r.get('volume') or 0),
            'close_price': c,
            'open_price':  float(r.get('open_price') or c),
            'high_price':  float(r.get('high_price') or c),
            'low_price':   float(r.get('low_price') or c),
        })
    return candles


# ─────────────────────────────────────────────────────────────────────
# Training pipeline
# ─────────────────────────────────────────────────────────────────────

def train_v3():
    print("=" * 60, flush=True)
    print("  TRADEORA MODEL v3 – 21 FEATURES", flush=True)
    print("=" * 60, flush=True)

    companies = sb.table("companies").select("id, symbol").eq("status", "active").execute().data or []
    active_ids = {co['id'] for co in companies}
    print(f"Active companies: {len(companies)}", flush=True)

    fund_res = sb.table("company_fundamentals").select("*").execute().data or []
    fund_map = {f['company_id']: f for f in fund_res}

    # ── 1. Load ALL prices with pagination ─────────────────────────────
    raw_prices = load_all_prices()
    print(f"Total raw rows: {len(raw_prices)}", flush=True)

    by_co: dict = {}
    for r in raw_prices:
        cid = r['company_id']
        if cid in active_ids and r.get('close_price'):
            by_co.setdefault(cid, []).append(r)

    # ── 2. Build feature matrix ─────────────────────────────────────────
    X_all, y_all = [], []
    n_stocks = 0
    n_skipped_gray = 0

    for co in companies:
        cid = co['id']
        rows = by_co.get(cid, [])
        if not rows:
            continue

        candles = build_candles_for_company(rows)
        if len(candles) < 60:
            continue

        n_stocks += 1
        closes = [c['close'] for c in candles]

        # New features – computed ONCE per stock on tail window
        feat6 = compute_new_features_for_stock(candles, fund_map.get(cid, {}))

        # Original 15 features – per candle
        feat_rows = extract_features_v2(candles)

        for item in feat_rows:
            i   = item['idx']
            lbl = build_label(closes, i)
            if lbl == -1:
                n_skipped_gray += 1
                continue
            X_all.append(item['feat15'] + feat6)
            y_all.append(lbl)

        if n_stocks % 50 == 0:
            print(f"  Processed {n_stocks} stocks, {len(X_all)} samples so far...", flush=True)

    X = np.array(X_all, dtype=np.float32)
    y = np.array(y_all, dtype=np.int32)

    buy_pct  = y.mean() * 100
    sell_pct = 100 - buy_pct

    print(f"\nDataset: {len(X)} samples | BUY {buy_pct:.1f}% | SELL {sell_pct:.1f}% | Gray skipped: {n_skipped_gray}", flush=True)

    if len(X) < 5000:
        print("⛔ Insufficient training data – check database connection.", flush=True)
        sys.exit(1)

    # ── 3. Cross-validation ─────────────────────────────────────────────
    tscv     = TimeSeriesSplit(n_splits=5)
    oof_pred = np.zeros(len(X), dtype=np.int32)
    imps     = []
    te_idxs  = []

    print("\n══ TimeSeriesSplit CV (5 Folds) ══", flush=True)
    for fold, (tr_idx, te_idx) in enumerate(tscv.split(X), 1):
        sc = StandardScaler()
        Xtr = sc.fit_transform(X[tr_idx])
        Xte = sc.transform(X[te_idx])
        m = XGBClassifier(
            n_estimators=300, max_depth=5,
            learning_rate=0.04, subsample=0.8,
            colsample_bytree=0.8, eval_metric='logloss',
            random_state=42, n_jobs=-1
        )
        m.fit(Xtr, y[tr_idx])
        preds = m.predict(Xte)
        oof_pred[te_idx] = preds
        te_idxs.extend(te_idx)
        imps.append(m.feature_importances_)
        acc  = accuracy_score(y[te_idx], preds)
        prec = precision_score(y[te_idx], preds, zero_division=0)
        print(f"  Fold {fold}: Accuracy={acc*100:.2f}%  Precision={prec*100:.2f}%", flush=True)

    te_arr     = np.array(te_idxs)
    acc_final  = accuracy_score(y[te_arr], oof_pred[te_arr])
    prec_final = precision_score(y[te_arr], oof_pred[te_arr], zero_division=0)
    avg_imps   = np.mean(imps, axis=0)
    rank       = sorted(zip(FEATURE_NAMES, avg_imps), key=lambda x: x[1], reverse=True)

    print(f"\n══ FINAL RESULTS ══", flush=True)
    print(f"  Accuracy  : {acc_final*100:.2f}%  (v2 baseline: 56.43%)", flush=True)
    print(f"  Precision : {prec_final*100:.2f}%", flush=True)
    print(f"\n  Feature Importance:", flush=True)
    for i, (nm, imp) in enumerate(rank, 1):
        print(f"    {i:2d}. {nm:<22} {imp*100:.2f}%", flush=True)

    # ── 4. Final model on full data ──────────────────────────────────────
    sc_final = StandardScaler()
    X_full   = sc_final.fit_transform(X)
    m_final  = XGBClassifier(
        n_estimators=300, max_depth=5,
        learning_rate=0.04, subsample=0.8,
        colsample_bytree=0.8, eval_metric='logloss',
        random_state=42, n_jobs=-1
    )
    m_final.fit(X_full, y)

    # ── 5. Save ─────────────────────────────────────────────────────────
    os.makedirs('models', exist_ok=True)
    joblib.dump(m_final, MODEL_OUT)
    joblib.dump(sc_final, SCALER_OUT)

    meta = {
        "version": "3.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "features": FEATURE_NAMES,
        "n_features": len(FEATURE_NAMES),
        "training_samples": int(len(X)),
        "class_distribution": {"buy_pct": round(float(buy_pct), 2), "sell_pct": round(float(sell_pct), 2)},
        "test_accuracy": round(float(acc_final), 4),
        "test_precision": round(float(prec_final), 4),
        "feature_importance_ranking": [
            {"feature": nm, "importance": round(float(imp), 4)} for nm, imp in rank
        ],
        "upgrade_notes": {
            "from_v2": "Added 6 new signals: Wyckoff, Smart Money, ICT FVG/OB, Elliott momentum, Fundamental",
            "new_features_strategy": "Computed once per stock on tail-40 window, broadcast to all training rows"
        }
    }
    with open(META_OUT, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Model v3 Saved!", flush=True)
    print(f"   {MODEL_OUT}  |  {SCALER_OUT}  |  {META_OUT}", flush=True)

    delta = acc_final - 0.5643
    print(f"\n📈 Accuracy delta vs v2: {delta*100:+.2f}%", flush=True)


if __name__ == '__main__':
    train_v3()
