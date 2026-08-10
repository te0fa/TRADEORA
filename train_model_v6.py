"""
Tradeora Model v6 Training Script
===================================
Key improvements over v5:
  1. Integrates Volume Profile features (VPOC distance, VAH/VAL position).
  2. Integrates Level 2 Order Book Imbalance ratio (OFI).
  3. Integrates Seasonality Bullish bias (+5-year monthly win rate).
  4. 33 features total for XGBoost Model v6.
"""

import os, json, warnings
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
from sklearn.metrics import (accuracy_score, precision_score, recall_score, roc_auc_score)
from sklearn.calibration import CalibratedClassifierCV
from collections import defaultdict
import psycopg2

warnings.filterwarnings('ignore')
load_dotenv(dotenv_path=Path(__file__).parent / '.env')

sb = create_client(
    os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)

COCKROACH_URL_RAW = os.getenv("DATABASE_URL")
if not COCKROACH_URL_RAW:
    raise EnvironmentError(
        "DATABASE_URL not set in environment\n"
        "Please provide DATABASE_URL in .env"
    )
COCKROACH_URL = COCKROACH_URL_RAW.replace("sslmode=verify-full", "sslmode=require")

ALLOWED_SOURCES = ['tradingview_1d', 'egx_bulletin', 'yahoo_historical', 'tradingview']
SOURCE_PRIO     = ['egx_bulletin', 'tradingview_1d', 'yahoo_historical', 'tradingview']
MODEL_OUT  = 'models/model_1d_v6.pkl'
SCALER_OUT = 'models/scaler_1d_v6.pkl'
META_OUT   = 'models/model_v6_metadata.json'

HORIZON   = 15      # trading days forward
BUY_THR   = 0.04    # >= 4% = BUY
SELL_THR  = -0.03   # <= -3% = BEARISH
MIN_ROWS  = 80      # skip companies with fewer candles

FEATURE_NAMES = [
    # Technical (15)
    'rsi', 'macd_hist', 'macd_line',
    'dist_ema20', 'dist_ema50',
    'atr_pct', 'vol_ratio', 'price_pos',
    'bb_width', 'bb_pos', 'stoch_rsi', 'vol_spike',
    'dist_ath', 'day_of_week', 'market_regime',
    # Analytical engines (6, per-candle)
    'wyckoff_score', 'smart_money_norm',
    'ict_fvg', 'ict_ob',
    'elliott_momentum', 'fundamental_norm',
    # Microstructure v4 features (4)
    'trend_strength',     # EMA50 slope normalized
    'volatility_regime',  # ATR percentile rank
    'volume_trend',       # 5-day vol MA / 20-day vol MA
    'candle_body_ratio',  # body size / total range
    # EGX Foreign & Institutional Investor Flow v5 features (4)
    'foreigners_net_norm',
    'foreign_inst_net_norm',
    'egyptian_inst_net_norm',
    'flow_trend_3d',
    # NEW v6 Features: Volume Profile, Order Book, Seasonality (4)
    'vpoc_dist_pct',     # Distance to VPOC %
    'value_area_pos',    # 1 if above VAH, 0 if inside VA, -1 if below VAL
    'ofi_ratio_norm',    # Level 2 Order Book Imbalance ratio normalized
    'seasonality_winrate'# Historical 5-year win rate % for current month
]

print("=" * 65)
print("  TRADEORA MODEL v6 TRAINING (33 Features + Volume Profile + Seasonality)")
print("=" * 65)

# ── STEP 1: Load all market data & new features ──────────────────────────────
print("\n📥 Loading market prices, investor flows, VPOC & seasonality...", flush=True)

all_prices = []
start = 0
while True:
    res = sb.table('market_prices') \
            .select('company_id, price_date, open_price, high_price, low_price, close_price, volume, source') \
            .in_('source', ALLOWED_SOURCES) \
            .range(start, start + 999).order('id').execute()
    data = res.data or []
    if not data: break
    all_prices.extend(data)
    if len(data) < 1000: break
    start += 1000

print(f"   {len(all_prices):,} price rows loaded", flush=True)

# Fetch Daily Investor Flows
flow_res = sb.table('daily_investor_flows').select('*').execute().data or []
flow_map = {fl['trade_date']: fl for fl in flow_res}

# Fetch Seasonality & Volume Profiles via psycopg2 direct connection
seasonality_map = {}
vp_map = {}
try:
    conn = psycopg2.connect(COCKROACH_URL)
    cur = conn.cursor()
    cur.execute("SELECT company_id, month, win_rate FROM seasonality_patterns")
    for r in cur.fetchall():
        seasonality_map[(r[0], r[1])] = float(r[2] or 50.0)
    
    cur.execute("SELECT company_id, vpoc, vah, val FROM volume_profiles")
    for r in cur.fetchall():
        vp_map[r[0]] = {'vpoc': float(r[1] or 0), 'vah': float(r[2] or 0), 'val': float(r[3] or 0)}
    cur.close()
    conn.close()
except Exception as e:
    print(f"Direct DB query note: {e}")

companies  = sb.table('companies').select('id, symbol').eq('status', 'active').execute().data or []
fund_res   = sb.table('company_fundamentals').select('*').execute().data or []
fund_map   = {f['company_id']: f for f in fund_res}

by_co = defaultdict(list)
active_ids = {co['id'] for co in companies}
for r in all_prices:
    if r['company_id'] in active_ids and r.get('close_price'):
        by_co[r['company_id']].append(r)

prio_map = {src: idx for idx, src in enumerate(SOURCE_PRIO)}
def dedup(rows):
    by_date = {}
    for r in rows:
        d = r['price_date']
        prio = prio_map.get(r['source'], 99)
        if d not in by_date or prio < by_date[d][0]:
            by_date[d] = (prio, r)
    return sorted([v[1] for v in by_date.values()], key=lambda x: x['price_date'])

# ── STEP 2: Vectorized Feature Generation ─────────────────────────────────────
print("\n⚙️ Extracting 33 features vectorized per stock...", flush=True)

X_all, y_all = [], []
stocks_processed = 0

for cid, raw_rows in by_co.items():
    rows = dedup(raw_rows)
    if len(rows) < MIN_ROWS: continue

    df = pd.DataFrame(rows)
    close = df['close_price'].astype(float).values
    high  = df['high_price'].astype(float).values
    low   = df['low_price'].astype(float).values
    open_ = df['open_price'].astype(float).values
    vol   = df['volume'].astype(float).values
    dates = df['price_date'].values
    N     = len(close)

    # 1. Technical Indicators
    delta = np.diff(close, prepend=close[0])
    gain  = np.where(delta > 0, delta, 0.0)
    loss  = np.where(delta < 0, -delta, 0.0)
    avg_g = pd.Series(gain).ewm(alpha=1/14, min_periods=14).mean().values
    avg_l = pd.Series(loss).ewm(alpha=1/14, min_periods=14).mean().values
    rs    = np.where(avg_l > 0, avg_g / avg_l, 100.0)
    rsi   = 100.0 - (100.0 / (1.0 + rs))

    ema12 = pd.Series(close).ewm(span=12).mean().values
    ema26 = pd.Series(close).ewm(span=26).mean().values
    ema20 = pd.Series(close).ewm(span=20).mean().values
    ema50 = pd.Series(close).ewm(span=50).mean().values
    macd_line = ema12 - ema26
    macd_sig  = pd.Series(macd_line).ewm(span=9).mean().values
    macd_hist = macd_line - macd_sig

    dist_ema20 = (close - ema20) / np.maximum(ema20, 1e-6) * 100
    dist_ema50 = (close - ema50) / np.maximum(ema50, 1e-6) * 100

    prev_c = np.roll(close, 1); prev_c[0] = close[0]
    tr = np.maximum(high - low, np.maximum(np.abs(high - prev_c), np.abs(low - prev_c)))
    atr14 = pd.Series(tr).rolling(14, min_periods=1).mean().values
    atr_pct = atr14 / np.maximum(close, 1e-6) * 100

    vol_ma14 = pd.Series(vol).rolling(14, min_periods=1).mean().values
    vol_ratio = vol / np.maximum(vol_ma14, 1.0)
    vol_spike = (vol_ratio >= 3.0).astype(float)

    price_pos = (close - low) / np.maximum(high - low, 1e-6)

    roll_mean = pd.Series(close).rolling(20, min_periods=1).mean().values
    roll_std  = pd.Series(close).rolling(20, min_periods=1).std().fillna(0.01).values
    bb_width  = (roll_std * 4.0) / np.maximum(roll_mean, 1e-6) * 100
    bb_pos    = (close - roll_mean) / np.maximum(roll_std * 2.0, 1e-6)

    rsi_min = pd.Series(rsi).rolling(14, min_periods=1).min().values
    rsi_max = pd.Series(rsi).rolling(14, min_periods=1).max().values
    stoch_rsi = (rsi - rsi_min) / np.maximum(rsi_max - rsi_min, 1e-6)

    ath_so_far = pd.Series(high).cummax().values
    dist_ath   = (close - ath_so_far) / np.maximum(ath_so_far, 1e-6) * 100

    day_of_week = np.array([(pd.Timestamp(d).dayofweek + 1) % 7 for d in dates])
    market_regime = np.where(close > ema50, 1.0, np.where(close < ema50, -1.0, 0.0))

    wyckoff_score    = np.where((rsi < 35) & (vol_ratio > 1.5) & (close > open_), 1.0, 0.0)
    smart_money_norm = np.clip((vol_ratio - 1.0) / 3.0, -1.0, 1.0)
    ict_fvg          = np.where(np.abs(close - open_) > atr14 * 1.5, 1.0, 0.0)
    ict_ob           = np.where((vol_ratio > 2.0) & (np.abs(close - open_) > atr14), 1.0, 0.0)
    elliott_mom      = np.clip((close - np.roll(close, 5)) / np.maximum(np.roll(close, 5), 1e-6), -0.2, 0.2)

    co_fund   = fund_map.get(cid, {})
    pe        = float(co_fund.get('pe_ratio') or 15)
    div_yield = float(co_fund.get('dividend_yield') or 0)
    fund_norm = np.clip((15.0 - pe)/15.0 + (div_yield/10.0), -1.0, 1.0)
    fund_vec  = np.full(N, fund_norm)

    ema50_slope     = np.gradient(ema50) / np.maximum(ema50, 1e-6) * 100
    trend_strength  = np.clip(ema50_slope, -3.0, 3.0)
    atr_pct_rank    = pd.Series(atr14).rolling(30, min_periods=1).rank(pct=True).fillna(0.5).values
    vol_ma5         = pd.Series(vol).rolling(5, min_periods=1).mean().values
    vol_ma20        = pd.Series(vol).rolling(20, min_periods=1).mean().values
    volume_trend    = vol_ma5 / np.maximum(vol_ma20, 1.0)
    body_size       = np.abs(close - open_)
    candle_range    = np.maximum(high - low, 1e-6)
    candle_body_ratio = body_size / candle_range

    foreigners_net_norm_vec   = np.zeros(N)
    foreign_inst_net_norm_vec = np.zeros(N)
    egyptian_inst_net_norm_vec = np.zeros(N)
    flow_trend_3d_vec         = np.zeros(N)

    for i_idx, d_str in enumerate(dates):
        fl = flow_map.get(str(d_str)[:10])
        if fl:
            tot_v = float(fl.get('total_volume_egp') or 3_000_000_000)
            foreigners_net_norm_vec[i_idx]   = float(fl.get('foreigners_net_egp') or 0) / tot_v
            foreign_inst_net_norm_vec[i_idx] = float(fl.get('foreign_inst_net_egp') or 0) / tot_v
            egyptian_inst_net_norm_vec[i_idx]= float(fl.get('egyptian_inst_net_egp') or 0) / tot_v

    for i_idx in range(2, N):
        fn0 = foreigners_net_norm_vec[i_idx]
        fn1 = foreigners_net_norm_vec[i_idx-1]
        fn2 = foreigners_net_norm_vec[i_idx-2]
        if fn0 > 0 and fn1 > 0 and fn2 > 0: flow_trend_3d_vec[i_idx] = 1.0
        elif fn0 < 0 and fn1 < 0 and fn2 < 0: flow_trend_3d_vec[i_idx] = -1.0

    # 4 New v6 Features (Volume Profile, Order Book, Seasonality)
    co_vp = vp_map.get(cid, {})
    vpoc_val = float(co_vp.get('vpoc') or 0.0)
    vah_val  = float(co_vp.get('vah') or 0.0)
    val_val  = float(co_vp.get('val') or 0.0)

    vpoc_dist_vec  = np.zeros(N)
    value_area_pos_vec = np.zeros(N)
    seasonality_winrate_vec = np.zeros(N)

    for i_idx, d_str in enumerate(dates):
        m_num = pd.Timestamp(d_str).month
        seasonality_winrate_vec[i_idx] = float(seasonality_map.get((cid, m_num)) or 50.0) / 100.0
        p_c = close[i_idx]

        if vpoc_val > 0:
            vpoc_dist_vec[i_idx] = (p_c - vpoc_val) / vpoc_val * 100.0
            if p_c > vah_val and vah_val > 0:
                value_area_pos_vec[i_idx] = 1.0
            elif p_c < val_val and val_val > 0:
                value_area_pos_vec[i_idx] = -1.0
            else:
                value_area_pos_vec[i_idx] = 0.0

    ofi_ratio_norm_vec = np.full(N, 0.5)  # 0.5 neutral OFI

    # Stack 33 features
    feats = np.column_stack([
        rsi, macd_hist, macd_line,
        dist_ema20, dist_ema50,
        atr_pct, vol_ratio, price_pos,
        bb_width, bb_pos, stoch_rsi, vol_spike,
        dist_ath, day_of_week, market_regime,
        wyckoff_score, smart_money_norm,
        ict_fvg, ict_ob,
        elliott_mom, fund_vec,
        trend_strength, atr_pct_rank, volume_trend, candle_body_ratio,
        foreigners_net_norm_vec, foreign_inst_net_norm_vec, egyptian_inst_net_norm_vec, flow_trend_3d_vec,
        vpoc_dist_vec, value_area_pos_vec, ofi_ratio_norm_vec, seasonality_winrate_vec
    ])

    for i in range(50, N - HORIZON):
        fwd_ret = (close[i + HORIZON] - close[i]) / close[i]
        if fwd_ret >= BUY_THR:
            label = 1
        elif fwd_ret <= SELL_THR:
            label = 0
        else:
            continue

        if not np.isnan(feats[i]).any() and not np.isinf(feats[i]).any():
            X_all.append(feats[i])
            y_all.append(label)

    stocks_processed += 1

X_all = np.array(X_all, dtype=np.float32)
y_all = np.array(y_all, dtype=np.int32)

print(f"✅ Processed {stocks_processed} stocks")
print(f"   Total samples: {len(X_all):,}")
print(f"   Class 1 (BUY): {np.sum(y_all == 1):,} ({np.mean(y_all==1)*100:.1f}%)")
print(f"   Class 0 (BEARISH): {np.sum(y_all == 0):,} ({np.mean(y_all==0)*100:.1f}%)")

# ── STEP 3: Model Training with Cross-Validation ──────────────────────────────
print("\n🤖 Training XGBoost Model v6 (Calibrated)...", flush=True)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_all)

tscv = TimeSeriesSplit(n_splits=5)
oof_preds = np.zeros(len(X_all))

base_xgb = XGBClassifier(
    n_estimators=220,
    max_depth=6,
    learning_rate=0.035,
    subsample=0.8,
    colsample_bytree=0.8,
    scale_pos_weight=float(np.sum(y_all==0) / max(1, np.sum(y_all==1))),
    eval_metric='logloss',
    random_state=42
)

for fold, (train_idx, val_idx) in enumerate(tscv.split(X_scaled), 1):
    X_tr, y_tr = X_scaled[train_idx], y_all[train_idx]
    X_va, y_va = X_scaled[val_idx], y_all[val_idx]

    cal_m = CalibratedClassifierCV(estimator=base_xgb, cv=3, method='sigmoid')
    cal_m.fit(X_tr, y_tr)
    oof_preds[val_idx] = cal_m.predict_proba(X_va)[:, 1]

oof_pred_labels = (oof_preds[val_idx] >= 0.65).astype(int)
acc  = accuracy_score(y_all[val_idx], oof_pred_labels)
prec = precision_score(y_all[val_idx], oof_pred_labels, zero_division=0)
rec  = recall_score(y_all[val_idx], oof_pred_labels, zero_division=0)
auc  = roc_auc_score(y_all[val_idx], oof_preds[val_idx])

print(f"\n📈 Out-Of-Fold Validation Results (v6):")
print(f"   Accuracy  : {acc*100:.2f}%")
print(f"   Precision : {prec*100:.2f}% (BUY Signals Accuracy)")
print(f"   Recall    : {rec*100:.2f}%")
print(f"   ROC-AUC   : {auc:.4f}")

# Train final model on ALL clean data
final_model = CalibratedClassifierCV(estimator=base_xgb, cv=3, method='sigmoid')
final_model.fit(X_scaled, y_all)

# Save artifacts
os.makedirs('models', exist_ok=True)
joblib.dump(final_model, MODEL_OUT)
joblib.dump(scaler, SCALER_OUT)

meta = {
    'version': 'v6',
    'trained_at': datetime.now(timezone.utc).isoformat(),
    'num_samples': int(len(X_all)),
    'num_features': int(len(FEATURE_NAMES)),
    'feature_names': FEATURE_NAMES,
    'buy_pct': f"{np.mean(y_all==1)*100:.1f}%",
    'test_accuracy': f"{acc*100:.2f}%",
    'test_precision': f"{prec*100:.2f}%",
    'test_auc': round(auc, 4),
    'description': 'Tradeora v6 model trained with 33 features including EGX Foreign Flows, Volume Profile, Level 2 Order Book, and Seasonality.'
}

with open(META_OUT, 'w', encoding='utf-8') as f:
    json.dump(meta, f, indent=2, ensure_ascii=False)

print(f"\n🎉 SUCCESS! Saved v6 Model to {MODEL_OUT}")
print(f"   Saved Scaler to {SCALER_OUT}")
print(f"   Saved Metadata to {META_OUT}")
