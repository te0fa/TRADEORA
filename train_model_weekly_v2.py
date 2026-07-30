import os
import sys
import logging
import json
import joblib
from datetime import datetime, timezone
from pathlib import Path
import numpy as np
import pandas as pd
import pandas_ta as ta
from dotenv import load_dotenv
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import accuracy_score, precision_score, recall_score
from supabase import create_client, Client

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

load_dotenv(BASE_DIR / ".env")

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s [%(name)s]: %(message)s')
logger = logging.getLogger("tradeora.train_weekly_v2")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")
    sys.exit(1)

sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
from services.canonical import get_canonical_candles

def compute_weekly_features(candles: list) -> list:
    """
    Extracts technical features for weekly candles (1W).
    Features match standard v2 model specifications.
    """
    if len(candles) < 30:
        return []

    df = pd.DataFrame(candles)
    closes = df['close'].astype(float).tolist()
    highs = df['high'].astype(float).tolist()
    lows = df['low'].astype(float).tolist()
    volumes = df['volume'].astype(float).tolist()

    # Wilder RSI(14)
    delta = pd.Series(closes).diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/14, min_periods=14, adjust=False).mean()
    rs = avg_gain / (avg_loss + 1e-10)
    rsi_list = (100 - (100 / (1 + rs))).tolist()

    # MACD (EMA12, EMA26, Signal EMA9)
    s = pd.Series(closes)
    ema12 = s.ewm(span=12, adjust=False).mean()
    ema26 = s.ewm(span=26, adjust=False).mean()
    macd_line = ema12 - ema26
    macd_signal = macd_line.ewm(span=9, adjust=False).mean()
    macd_hist = macd_line - macd_signal

    # EMAs
    ema20 = s.ewm(span=20, adjust=False).mean().tolist()
    ema50 = s.ewm(span=50, adjust=False).mean().tolist()

    # ATR(14)
    trs = [max(h - l, abs(h - closes[idx-1]), abs(l - closes[idx-1]))
           for idx, (h, l) in enumerate(zip(highs, lows)) if idx > 0]
    trs.insert(0, highs[0] - lows[0])
    atr_series = pd.Series(trs).ewm(alpha=1/14, min_periods=14, adjust=False).mean().tolist()

    extracted = []

    # Horizon for weekly model: 4 weeks (1 month) forward gain >= 3.0%
    HORIZON = 4
    GAIN_TARGET = 0.03

    for i in range(26, len(candles) - HORIZON):
        c_price = closes[i]
        if c_price <= 0:
            continue

        rsi_val = rsi_list[i] if not np.isnan(rsi_list[i]) else 50.0
        m_line = macd_line.iloc[i]
        m_sig = macd_signal.iloc[i]
        m_h = macd_hist.iloc[i]

        e20 = ema20[i]
        e50 = ema50[i]
        dist_e20 = ((c_price - e20) / e20) * 100 if e20 > 0 else 0.0
        dist_e50 = ((c_price - e50) / e50) * 100 if e50 > 0 else 0.0

        atr_v = atr_series[i] if not np.isnan(atr_series[i]) else (c_price * 0.03)
        atr_pct = (atr_v / c_price) * 100

        v_sub = volumes[max(0, i-10):i]
        avg_v = sum(v_sub) / len(v_sub) if v_sub and sum(v_sub) > 0 else 1.0
        v_ratio = min(volumes[i] / avg_v if avg_v > 0 else 1.0, 5.0)

        # 52-week High distance
        w52_high = max(highs[max(0, i-52):i+1])
        dist_52w = ((w52_high - c_price) / w52_high) * 100 if w52_high > 0 else 0.0

        feat_row = [
            round(rsi_val, 2),
            round(m_line, 4),
            round(m_sig, 4),
            round(m_h, 4),
            round(dist_e20, 2),
            round(dist_e50, 2),
            round(atr_pct, 2),
            round(v_ratio, 2),
            round(dist_52w, 2)
        ]

        # Target label
        future_prices = closes[i+1 : i+1+HORIZON]
        max_future = max(future_prices)
        min_future = min(future_prices)

        gain_pct = (max_future - c_price) / c_price
        drop_pct = (c_price - min_future) / c_price

        # Class 1 if target gain met before severe drop
        label = 1 if (gain_pct >= GAIN_TARGET and drop_pct < 0.05) else 0

        extracted.append({
            'time': candles[i].get('time'),
            'feat_row': feat_row,
            'label': label
        })

    return extracted

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

def train_weekly_model():
    logger.info("=== Starting Weekly ML Model Training (model_1w_v2) ===")

    companies = sb.table("companies").select("id, symbol").eq("status", "active").execute().data or []
    logger.info(f"Fetched {len(companies)} active companies.")

    X_all, y_all = [], []

    for co in companies:
        cid = co['id']
        symbol = co['symbol']

        res = sb.table("market_prices") \
                .select("price_date, open_price, high_price, low_price, close_price, volume") \
                .eq("company_id", cid) \
                .order("price_date", desc=False) \
                .execute()
        daily_rows = res.data or []
        candles = aggregate_daily_to_weekly(daily_rows)

        if not candles or len(candles) < 35:
            continue

        extracted = compute_weekly_features(candles)
        for item in extracted:
            X_all.append(item['feat_row'])
            y_all.append(item['label'])

    X = np.array(X_all)
    y = np.array(y_all)

    logger.info(f"Dataset compiled: {X.shape[0]} weekly samples across {len(companies)} companies.")
    if X.shape[0] < 500:
        logger.error("Insufficient samples for training.")
        return

    buy_cnt = np.sum(y == 1)
    sell_cnt = np.sum(y == 0)
    logger.info(f"Class Balance: BUY(1)={buy_cnt} ({buy_cnt/len(y):.1%}), SELL(0)={sell_cnt} ({sell_cnt/len(y):.1%})")

    # TimeSeriesSplit
    tscv = TimeSeriesSplit(n_splits=5)
    scalers = []
    models = []
    scores = []

    for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
        X_tr, y_tr = X[train_idx], y[train_idx]
        X_va, y_va = X[val_idx], y[val_idx]

        sc = StandardScaler()
        X_tr_sc = sc.fit_transform(X_tr)
        X_va_sc = sc.transform(X_va)

        model = GradientBoostingClassifier(
            n_estimators=150,
            max_depth=3,
            learning_rate=0.05,
            subsample=0.85,
            random_state=42
        )
        model.fit(X_tr_sc, y_tr)

        preds = model.predict(X_va_sc)
        acc = accuracy_score(y_va, preds)
        prec = precision_score(y_va, preds, zero_division=0)
        rec = recall_score(y_va, preds, zero_division=0)

        scores.append({'fold': fold+1, 'acc': acc, 'prec': prec, 'rec': rec})
        scalers.append(sc)
        models.append(model)
        logger.info(f"Fold {fold+1}: Acc={acc:.2%}, Prec={prec:.2%}, Rec={rec:.2%}")

    # Best fold model selection
    best_idx = np.argmax([s['acc'] for s in scores])
    best_model = models[best_idx]
    best_scaler = scalers[best_idx]
    best_score = scores[best_idx]

    logger.info(f"Selected Best Fold {best_score['fold']}: Acc={best_score['acc']:.2%}")

    # Export artifacts
    os.makedirs('models', exist_ok=True)
    m_path = 'models/model_1w_v2.pkl'
    s_path = 'models/scaler_1w_v2.pkl'
    meta_path = 'models/model_1w_v2_metadata.json'

    joblib.dump(best_model, m_path)
    joblib.dump(best_scaler, s_path)

    metadata = {
        'model_version': '1w_v2.0',
        'timeframe': '1w',
        'trained_at': datetime.now(timezone.utc).isoformat(),
        'samples': X.shape[0],
        'accuracy': float(best_score['acc']),
        'precision_buy': float(best_score['prec']),
        'recall_buy': float(best_score['rec']),
        'class_balance_buy_pct': float(buy_cnt / len(y) * 100)
    }

    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    logger.info(f"✅ Successfully trained and exported 1W Weekly Model artifacts to models/")

if __name__ == '__main__':
    train_weekly_model()
