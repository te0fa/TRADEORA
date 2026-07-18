import os
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
sb = create_client(os.getenv('SUPABASE_URL'),
                   os.getenv('SUPABASE_KEY'))

# ── مؤشرات فنية بسيطة ──────────────────

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

def calc_features(candles, sector_return=0.0,
                  egx30_return=0.0):
    closes = [c['close'] for c in candles]
    highs  = [c['high']  for c in candles]
    lows   = [c['low']   for c in candles]
    vols   = [c.get('volume', 0) for c in candles]
    times  = [c.get('time', None) for c in candles]

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
            window = [x for x in rsi_vals[i-period:i+1]
                      if x is not None]
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
    for i in range(50, len(candles)-1):
        cl = closes[i]
        if None in [rsi[i], ema12[i], ema26[i],
                    ema20[i], ema50[i],
                    bb_width[i], bb_pos[i],
                    stoch_rsi[i]]:
            continue

        # MACD
        macd_raw  = ema12[i] - ema26[i]
        macd_prev = ((ema12[i-1] or 0) -
                     (ema26[i-1] or 0))
        macd_hist = macd_raw - macd_prev

        # ATR
        trs = [max(highs[j]-lows[j],
                   abs(highs[j]-closes[j-1]),
                   abs(lows[j]-closes[j-1]))
               for j in range(max(1,i-13), i+1)]
        atr = sum(trs)/len(trs) if trs else 0.001

        # Volume spike
        avg_vol   = sum(vols[i-13:i+1])/14 \
                    if i >= 13 else 1
        vol_ratio = vols[i]/avg_vol \
                    if avg_vol > 0 else 1
        vol_spike = 1 if vol_ratio >= 3 else 0

        # Distance to ATH (52-week high)
        lookback_52 = min(i, 252)
        ath_52  = max(highs[i-lookback_52:i+1])
        dist_ath = (cl - ath_52) / ath_52 * 100

        # Day of week (0=Mon, 6=Sun, EGX: 0=Sun)
        day_of_week = 0
        if times[i]:
            try:
                import datetime
                if isinstance(times[i], (int, float)):
                    dt = datetime.datetime.fromtimestamp(
                        times[i])
                    day_of_week = dt.weekday()
                elif hasattr(times[i], 'weekday'):
                    day_of_week = times[i].weekday()
            except:
                pass

        # Day of week for EGX (Sun=0, Mon=1, ..., Thu=4, Fri=5, Sat=6)
        # Python weekday() returns 0 for Monday and 6 for Sunday.
        # Let's adjust to EGX convention:
        # Mon (0) -> 1, Tue (1) -> 2, Wed (2) -> 3, Thu (3) -> 4, Fri (4) -> 5, Sat (5) -> 6, Sun (6) -> 0.
        day_of_week = (day_of_week + 1) % 7

        # Price position in candle
        candle_range = highs[i] - lows[i]
        price_pos = (cl - lows[i]) / \
                    (candle_range + 0.001)

        rows.append({
            'idx': i,
            # ── الـ features الأصلية ──
            'rsi':        rsi[i],
            'macd_hist':  macd_hist,
            'macd_raw':   macd_raw,
            'dist_ema20': (cl-ema20[i])/ema20[i]*100,
            'dist_ema50': (cl-ema50[i])/ema50[i]*100,
            'atr_pct':    atr/cl*100,
            'vol_ratio':  min(vol_ratio, 5),
            'price_pos':  price_pos,
            # ── الـ features الجديدة ──
            'bb_width':   bb_width[i],
            'bb_pos':     bb_pos[i],
            'stoch_rsi':  stoch_rsi[i],
            'vol_spike':  vol_spike,
            'dist_ath':   dist_ath,
            'day_of_week': day_of_week,
            'sector_ret': sector_return,
            'egx30_ret':  egx30_return,
        })
    return rows

# ── بناء Dataset ────────────────────────

def build_dataset(timeframe='1d',
                  tp_pct=0.035, lookahead=30):
    print(f"جلب بيانات {timeframe}...", flush=True)
    companies = sb.table('companies')\
                   .select('id,symbol').execute().data

    X_rows, y_rows = [], []

    for co in companies:
        cid, sym = co['id'], co['symbol']

        if timeframe == '1d':
            rows = sb.table('market_prices')\
                .select('open_price,high_price,'
                        'low_price,close_price,volume')\
                .eq('company_id', cid)\
                .order('price_date').execute().data
            candles = [{
                'open':  r['open_price']  or r['close_price'],
                'high':  r['high_price']  or r['close_price'],
                'low':   r['low_price']   or r['close_price'],
                'close': r['close_price'],
                'volume':r['volume'] or 0
            } for r in rows if r['close_price']]
        else:
            src = f'tradingview_{timeframe}'
            rows = sb.table('intraday_snapshots')\
                .select('open_price,high_price,'
                        'low_price,price,volume')\
                .eq('company_id', cid)\
                .eq('source', src)\
                .order('snapshot_time').execute().data
            candles = [{
                'open':  r['open_price']  or r['price'],
                'high':  r['high_price']  or r['price'],
                'low':   r['low_price']   or r['price'],
                'close': r['price'],
                'volume':r.get('volume') or 0
            } for r in rows if r['price']]

        if len(candles) < 60:
            continue

        features = calc_features(candles)
        closes   = [c['close'] for c in candles]
        highs    = [c['high']  for c in candles]
        lows     = [c['low']   for c in candles]

        for f in features:
            i = f['idx']
            if i + lookahead >= len(candles):
                continue

            entry = closes[i]
            tp    = entry * (1 + tp_pct)
            sl    = entry * (1 - tp_pct)

            future_h = highs[i+1:i+lookahead+1]
            future_l = lows[i+1:i+lookahead+1]

            hit_tp = any(h >= tp for h in future_h)
            hit_sl = any(l <= sl for l in future_l)

            if not hit_tp and not hit_sl:
                continue

            label = 1 if hit_tp else 0

            X_rows.append([
                f['rsi'], f['macd_hist'], f['macd_raw'],
                f['dist_ema20'], f['dist_ema50'],
                f['atr_pct'], f['vol_ratio'], f['price_pos'],
                f['bb_width'], f['bb_pos'],
                f['stoch_rsi'], f['vol_spike'],
                f['dist_ath'], f['day_of_week'],
                f['sector_ret'], f['egx30_ret'],
            ])
            y_rows.append(label)

    return np.array(X_rows), np.array(y_rows)

# ── التدريب ─────────────────────────────

CONFIGS = {
    '1d':  {'tp': 0.035, 'look': 30},
    '15m': {'tp': 0.015, 'look': 20},
    '1h':  {'tp': 0.020, 'look': 20},
    '4h':  {'tp': 0.025, 'look': 20},
}

os.makedirs('models', exist_ok=True)

for tf, cfg in CONFIGS.items():
    print(f"\n══ تدريب نموذج {tf} ══", flush=True)
    X, y = build_dataset(tf, cfg['tp'], cfg['look'])

    if len(X) < 100:
        print(f"  بيانات غير كافية ({len(X)}), تخطي", flush=True)
        continue

    print(f"  Dataset: {len(X)} إشارة "
          f"| إيجابية: {y.sum()} "
          f"| سلبية: {len(y)-y.sum()}", flush=True)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric='logloss',
        random_state=42
    )

    scores = cross_val_score(
        model, X_scaled, y,
        cv=5, scoring='roc_auc'
    )
    print(f"  Cross-val AUC: {scores.mean():.3f} "
          f"(±{scores.std():.3f})", flush=True)

    model.fit(X_scaled, y)

    joblib.dump(model,  f'models/model_{tf}.pkl')
    joblib.dump(scaler, f'models/scaler_{tf}.pkl')
    print(f"  ✅ تم الحفظ: models/model_{tf}.pkl", flush=True)

print("\n✅ كل النماذج اتدربت!", flush=True)
