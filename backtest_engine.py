"""
TRADEORA Comprehensive Backtest Engine
========================================
Tests ALL analytical components of the platform against historical EGX data.

Components evaluated:
  1. ML Model v3        – XGBoost 21-feature probability signal
  2. ICT/SMC            – FVG + Order Block detection
  3. Wyckoff            – Accumulation/spring confluence
  4. Elliott Wave       – 15-bar momentum impulse proxy
  5. Smart Money        – Volume/spread institutional signal
  6. Fundamental Score  – P/E, EPS, D/E, dividend metrics
  7. News Sentiment     – Macro/news impact adjustment
  8. Combined System    – All signals together (current platform)
  9. Benchmark          – Buy & Hold EGX index equivalent

Output: Detailed JSON report + printed summary table
"""

import os, sys, json, warnings
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client
from collections import defaultdict

warnings.filterwarnings('ignore')

load_dotenv(Path(__file__).parent / '.env')
sb = create_client(
    os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
)

# ── Load ML Model ────────────────────────────────────────────────────────────
MODEL_PATH  = Path(__file__).parent / 'models/model_1d_v3.pkl'
SCALER_PATH = Path(__file__).parent / 'models/scaler_1d_v3.pkl'
V2_MODEL    = Path(__file__).parent / 'models/model_1d_v2.pkl'
V2_SCALER   = Path(__file__).parent / 'models/scaler_1d_v2.pkl'

try:
    ml_model  = joblib.load(MODEL_PATH)
    ml_scaler = joblib.load(SCALER_PATH)
    ML_VERSION = 'v3'
except:
    ml_model  = joblib.load(V2_MODEL)
    ml_scaler = joblib.load(V2_SCALER)
    ML_VERSION = 'v2'

print(f"✅ Loaded ML model {ML_VERSION}", flush=True)

ALLOWED_SOURCES = ['tradingview_1d', 'egx_bulletin', 'yahoo_historical', 'tradingview']
SOURCE_PRIO     = ['egx_bulletin', 'tradingview_1d', 'yahoo_historical', 'tradingview']

FORWARD_HORIZONS = [5, 10, 15, 20]  # Trading days
MIN_CANDLES      = 80
BUY_THRESHOLD    = 0.04   # 4% gain = BUY
SELL_THRESHOLD   = -0.03  # 3% loss = SELL

# ══════════════════════════════════════════════════════════════════════════════
# DATA LOADING
# ══════════════════════════════════════════════════════════════════════════════

def load_all_data():
    print("\n📥 Loading all market prices (paginated)...", flush=True)
    all_prices = []
    start = 0
    while True:
        res = sb.table('market_prices') \
                .select('company_id, price_date, open_price, high_price, low_price, close_price, volume, source') \
                .in_('source', ALLOWED_SOURCES) \
                .range(start, start + 999) \
                .order('id').execute()
        data = res.data or []
        if not data: break
        all_prices.extend(data)
        if len(data) < 1000: break
        start += 1000
    print(f"   Fetched {len(all_prices):,} rows", flush=True)

    companies = sb.table('companies').select('id, symbol, name_ar').eq('status', 'active').execute().data or []
    fund_res  = sb.table('company_fundamentals').select('*').execute().data or []
    fund_map  = {f['company_id']: f for f in fund_res}

    print(f"   {len(companies)} active companies | {len(fund_map)} with fundamentals", flush=True)
    return all_prices, companies, fund_map


def build_company_candles(rows: list) -> pd.DataFrame:
    """Deduplicate by date (source priority), build sorted DataFrame."""
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

    records = []
    for r in sorted(day_map.values(), key=lambda x: x['price_date']):
        c = float(r.get('close_price') or 0)
        if c <= 0: continue
        records.append({
            'date':   r['price_date'],
            'open':   float(r.get('open_price') or c),
            'high':   float(r.get('high_price') or c),
            'low':    float(r.get('low_price') or c),
            'close':  c,
            'volume': float(r.get('volume') or 0),
        })
    return pd.DataFrame(records)


# ══════════════════════════════════════════════════════════════════════════════
# VECTORIZED SIGNAL COMPUTATION
# ══════════════════════════════════════════════════════════════════════════════

def compute_signals(df: pd.DataFrame, fund: dict) -> pd.DataFrame:
    """Compute ALL signals vectorized on a company's full OHLCV DataFrame."""
    c = df['close'].values.astype(np.float64)
    h = df['high'].values.astype(np.float64)
    l = df['low'].values.astype(np.float64)
    v = df['volume'].values.astype(np.float64)
    o = df['open'].values.astype(np.float64)
    n = len(c)

    # ── 1. RSI ──────────────────────────────────────────────────────────────
    delta = np.diff(c, prepend=c[0])
    gain  = np.where(delta > 0, delta, 0.0)
    loss  = np.where(delta < 0, -delta, 0.0)
    rsi = np.full(n, 50.0)
    for i in range(14, n):
        ag = gain[i-13:i+1].mean()
        al = loss[i-13:i+1].mean()
        rs = ag / al if al > 0 else 100
        rsi[i] = 100 - (100 / (1 + rs))

    # ── 2. MACD ─────────────────────────────────────────────────────────────
    def ema_vec(arr, span):
        k = 2 / (span + 1)
        e = np.zeros(len(arr))
        e[0] = arr[0]
        for i in range(1, len(arr)):
            e[i] = arr[i] * k + e[i-1] * (1 - k)
        return e
    ema12 = ema_vec(c, 12)
    ema26 = ema_vec(c, 26)
    ema20 = ema_vec(c, 20)
    ema50 = ema_vec(c, 50)
    macd_line = ema12 - ema26
    signal_line = ema_vec(macd_line, 9)
    macd_hist = macd_line - signal_line

    # ── 3. ATR ──────────────────────────────────────────────────────────────
    tr = np.maximum(h - l, np.maximum(np.abs(h - np.roll(c, 1)), np.abs(l - np.roll(c, 1))))
    tr[0] = h[0] - l[0]
    atr14 = np.convolve(tr, np.ones(14)/14, mode='full')[:n]

    # ── 4. Bollinger Bands ──────────────────────────────────────────────────
    bb_mid  = np.convolve(c, np.ones(20)/20, mode='full')[:n]
    bb_std  = np.array([c[max(0,i-19):i+1].std() for i in range(n)])
    bb_pos  = np.where(bb_std > 0, (c - bb_mid) / (2 * bb_std), 0)
    bb_width= np.where(bb_mid > 0, (bb_std * 4) / bb_mid * 100, 0)

    # ── 5. Volume ratio ─────────────────────────────────────────────────────
    vol_mean14 = np.convolve(v, np.ones(14)/14, mode='full')[:n]
    vol_ratio  = np.where(vol_mean14 > 0, np.minimum(v / vol_mean14, 5), 1.0)

    # ── 6. StochRSI ─────────────────────────────────────────────────────────
    stoch_rsi = np.full(n, 0.5)
    for i in range(14, n):
        w = rsi[i-13:i+1]
        lo, hi = w.min(), w.max()
        stoch_rsi[i] = (rsi[i] - lo) / (hi - lo) if hi > lo else 0.5

    # ── 7. ATH distance ─────────────────────────────────────────────────────
    ath = np.array([h[:i+1].max() for i in range(n)])
    dist_ath = (c - ath) / ath * 100

    # ── 8. ICT: FVG (vectorized) ────────────────────────────────────────────
    # Bullish FVG: l[i] > h[i-2]  (gap between i-2 high and i low)
    bullish_fvg = np.zeros(n)
    bearish_fvg = np.zeros(n)
    for i in range(2, n):
        # Bullish FVG detected if any in last 15 candles
        window_start = max(2, i - 14)
        for j in range(window_start, i + 1):
            if j >= 2 and l[j] > h[j-2]:
                bullish_fvg[i] = 1; break
        for j in range(window_start, i + 1):
            if j >= 2 and h[j] < l[j-2]:
                bearish_fvg[i] = 1; break

    # ── 9. ICT: Order Block (vectorized) ────────────────────────────────────
    bullish_ob = np.zeros(n)
    for i in range(3, n):
        # Bearish candle followed by strong bullish breakout
        if c[i-1] < o[i-1]:  # previous bearish
            if c[i] > h[i-1] * 1.005:  # current breaks above
                bullish_ob[i] = 1

    # ── 10. Wyckoff proxy (Volume accumulation score) ────────────────────────
    # During low price (< 20-day avg), high volume = accumulation
    wyckoff_score = np.zeros(n)
    for i in range(20, n):
        avg_close  = c[i-19:i+1].mean()
        avg_vol    = v[i-19:i+1].mean()
        below_avg  = c[i] < avg_close
        high_vol   = v[i] > avg_vol * 1.3
        up_close   = c[i] > o[i]  # green candle
        if below_avg and high_vol and up_close:
            wyckoff_score[i] = 1.0
        elif below_avg and high_vol:
            wyckoff_score[i] = 0.6
        elif not below_avg and high_vol and up_close:
            wyckoff_score[i] = 0.4

    # ── 11. Smart Money (spread / volume ratio) ──────────────────────────────
    spread = h - l
    typical = (h + l + c) / 3
    smart_money = np.zeros(n)
    for i in range(14, n):
        avg_sp = spread[i-13:i+1].mean()
        avg_vl = v[i-13:i+1].mean()
        if avg_sp > 0 and avg_vl > 0:
            sm = (v[i] / avg_vl) / (spread[i] / avg_sp)  # high vol + narrow spread = smart
            smart_money[i] = min(sm / 3, 1.0)

    # ── 12. Elliott momentum proxy ───────────────────────────────────────────
    elliott_mom = np.zeros(n)
    for i in range(15, n):
        ret = (c[i] - c[i-15]) / c[i-15] * 100
        elliott_mom[i] = min(max(ret / 20, -1), 1)

    # ── 13. Fundamental Score (static per company) ───────────────────────────
    def norm_fund(f):
        if not f: return 0.5
        score = 0.5
        pe = f.get('pe_ratio') or 0
        if 0 < pe < 15: score += 0.1
        elif 15 <= pe < 25: score += 0.05
        eps = f.get('eps') or 0
        if eps > 0: score += 0.1
        de = f.get('debt_to_equity') or 0
        if 0 < de < 1: score += 0.1
        dv = f.get('dividend_yield') or 0
        if dv > 0: score += 0.05
        return min(score, 1.0)

    fundamental_norm = norm_fund(fund)

    # ── 14. Market regime ────────────────────────────────────────────────────
    market_regime = np.where(macd_line > signal_line, 1.0, -1.0)

    # ── 15. Price position in candle range ───────────────────────────────────
    candle_range = h - l
    price_pos = np.where(candle_range > 0, (c - l) / candle_range, 0.5)

    # Assemble feature matrix for ML (15 or 21 features depending on model)
    feat_v3 = np.column_stack([
        rsi, macd_hist, macd_line,
        (c - ema20) / ema20 * 100, (c - ema50) / ema50 * 100,
        atr14 / c * 100, vol_ratio, price_pos,
        bb_width, bb_pos, stoch_rsi,
        np.where(vol_ratio >= 3, 1, 0),
        dist_ath,
        np.zeros(n),  # day_of_week placeholder
        market_regime,
        # 6 new features (broadcast)
        np.full(n, wyckoff_score.mean()),
        np.full(n, smart_money.mean()),
        bullish_fvg,
        bullish_ob,
        elliott_mom,
        np.full(n, fundamental_norm),
    ])

    n_feat = getattr(ml_scaler, 'n_features_in_', feat_v3.shape[1])
    feat_use = feat_v3[:, :n_feat]

    # Predict ML probabilities for all candles at once
    valid_mask = np.all(np.isfinite(feat_use), axis=1) & (np.arange(n) >= 50)
    ml_probs = np.full(n, 0.5)
    if valid_mask.sum() > 0:
        scaled = ml_scaler.transform(feat_use[valid_mask])
        ml_probs[valid_mask] = ml_model.predict_proba(scaled)[:, 1]

    df2 = df.copy()
    df2['rsi']            = rsi
    df2['macd_hist']      = macd_hist
    df2['macd_line']      = macd_line
    df2['signal_line']    = signal_line
    df2['atr14']          = atr14
    df2['vol_ratio']      = vol_ratio
    df2['bb_pos']         = bb_pos
    df2['wyckoff_score']  = wyckoff_score
    df2['smart_money']    = smart_money
    df2['bullish_fvg']    = bullish_fvg
    df2['bearish_fvg']    = bearish_fvg
    df2['bullish_ob']     = bullish_ob
    df2['elliott_mom']    = elliott_mom
    df2['fundamental']    = fundamental_norm
    df2['market_regime']  = market_regime
    df2['ml_prob']        = ml_probs
    df2['valid']          = (np.arange(n) >= 60) & np.isfinite(ml_probs)
    return df2


# ══════════════════════════════════════════════════════════════════════════════
# BACKTEST ENGINE
# ══════════════════════════════════════════════════════════════════════════════

class BacktestResult:
    def __init__(self, name: str):
        self.name   = name
        self.trades = []  # (entry_return_H5, H10, H15, H20, signal_strength)

    def add(self, returns_by_horizon: dict, signal_strength: float = 1.0):
        self.trades.append((returns_by_horizon, signal_strength))

    def summary(self, horizon: int = 15) -> dict:
        if not self.trades:
            return {'name': self.name, 'n': 0}
        rets = [t[0].get(horizon, 0) for t in self.trades if t[0].get(horizon) is not None]
        if not rets:
            return {'name': self.name, 'n': 0}
        rets = np.array(rets)
        winners = rets[rets >= BUY_THRESHOLD * 100]
        losers  = rets[rets <= SELL_THRESHOLD * 100]
        neutral = rets[(rets > SELL_THRESHOLD * 100) & (rets < BUY_THRESHOLD * 100)]

        win_rate = len(winners) / len(rets) * 100 if rets.size else 0
        avg_ret  = rets.mean()
        avg_win  = winners.mean() if winners.size else 0
        avg_loss = losers.mean()  if losers.size  else 0
        rr       = avg_win / abs(avg_loss) if avg_loss < 0 else 0
        exp      = (win_rate/100 * avg_win) + ((1 - win_rate/100) * avg_loss) if avg_loss < 0 else avg_ret

        # Sharpe proxy (mean/std)
        sharpe = avg_ret / rets.std() * np.sqrt(252/horizon) if rets.std() > 0 else 0

        return {
            'name':          self.name,
            'n_trades':      len(rets),
            'win_rate':      round(win_rate, 1),
            'avg_return':    round(avg_ret, 2),
            'avg_win':       round(avg_win, 2),
            'avg_loss':      round(avg_loss, 2),
            'rr_ratio':      round(rr, 2),
            'expectancy':    round(exp, 2),
            'sharpe_proxy':  round(sharpe, 2),
            'n_winners':     int(len(winners)),
            'n_losers':      int(len(losers)),
            'n_neutral':     int(len(neutral)),
        }


def run_backtest(df: pd.DataFrame, horizon_days: list = FORWARD_HORIZONS) -> dict:
    """Run all signal backtests on a single company's DataFrame."""
    closes = df['close'].values
    n = len(closes)

    results = {
        'ml_any':          BacktestResult('ML Any (>0.5)'),
        'ml_65':           BacktestResult('ML >= 0.65'),
        'ml_72':           BacktestResult('ML >= 0.72'),
        'ml_80':           BacktestResult('ML >= 0.80'),
        'ict_fvg':         BacktestResult('ICT FVG'),
        'ict_ob':          BacktestResult('ICT Order Block'),
        'wyckoff':         BacktestResult('Wyckoff Accum.'),
        'smart_money':     BacktestResult('Smart Money'),
        'elliott_bull':    BacktestResult('Elliott Bull'),
        'fundamental_hi':  BacktestResult('Fundamental High'),
        'macd_cross':      BacktestResult('MACD Crossover'),
        'rsi_oversold':    BacktestResult('RSI Oversold'),
        'combined_strict': BacktestResult('Combined Strict (platform)'),
        'buy_hold':        BacktestResult('Buy & Hold'),
    }

    for i in range(60, n - max(horizon_days)):
        if not df.iloc[i]['valid']:
            continue

        # Forward returns at each horizon
        fwd = {}
        for h in horizon_days:
            if i + h < n:
                fwd[h] = (closes[i + h] - closes[i]) / closes[i] * 100

        if not fwd:
            continue

        row = df.iloc[i]
        ml  = row['ml_prob']
        fvg = row['bullish_fvg']
        ob  = row['bullish_ob']
        wyk = row['wyckoff_score']
        sm  = row['smart_money']
        ell = row['elliott_mom']
        fun = row['fundamental']
        mcd = row['macd_hist']
        mcd_prev = df.iloc[i-1]['macd_hist'] if i > 0 else mcd
        rsi = row['rsi']

        # 1. ML signals at various thresholds
        if ml > 0.50: results['ml_any'].add(fwd, ml)
        if ml >= 0.65: results['ml_65'].add(fwd, ml)
        if ml >= 0.72: results['ml_72'].add(fwd, ml)
        if ml >= 0.80: results['ml_80'].add(fwd, ml)

        # 2. ICT FVG
        if fvg == 1: results['ict_fvg'].add(fwd, 1.0)

        # 3. ICT Order Block
        if ob == 1: results['ict_ob'].add(fwd, 1.0)

        # 4. Wyckoff accumulation
        if wyk >= 0.6: results['wyckoff'].add(fwd, wyk)

        # 5. Smart Money
        if sm >= 0.5: results['smart_money'].add(fwd, sm)

        # 6. Elliott bullish momentum
        if ell > 0.3: results['elliott_bull'].add(fwd, ell)

        # 7. Fundamental high score
        if fun >= 0.65: results['fundamental_hi'].add(fwd, fun)

        # 8. MACD crossover (hist crosses above 0)
        if mcd > 0 and mcd_prev <= 0: results['macd_cross'].add(fwd, 1.0)

        # 9. RSI oversold
        if rsi <= 35: results['rsi_oversold'].add(fwd, 1.0)

        # 10. Combined (current platform – requires ML >= 0.65 + at least 2 confirmations)
        confirmations = int(fvg) + int(ob) + int(wyk >= 0.6) + int(sm >= 0.5) + int(ell > 0.3)
        if ml >= 0.65 and confirmations >= 2:
            results['combined_strict'].add(fwd, ml)

        # 11. Buy & Hold baseline (every candle)
        results['buy_hold'].add(fwd, 1.0)

    return {k: v.summary(15) for k, v in results.items()}


# ══════════════════════════════════════════════════════════════════════════════
# PLATFORM VALIDATION (actual recommended_trades performance)
# ══════════════════════════════════════════════════════════════════════════════

def analyze_actual_trades() -> dict:
    """Analyze the actual recommended_trades outcomes vs ML probability."""
    print("\n📊 Analyzing actual recommended_trades outcomes...", flush=True)

    trades = sb.table('recommended_trades') \
               .select('ml_probability, pnl_percent, direction, status, timeframe, recommended_at') \
               .eq('status', 'closed') \
               .limit(2000).execute().data or []

    valid = [t for t in trades if t.get('ml_probability') and t.get('pnl_percent') is not None]
    print(f"   Valid closed trades: {len(valid)}", flush=True)

    # Bucket by ML probability
    buckets = {
        '0.50-0.60': [], '0.60-0.65': [], '0.65-0.70': [],
        '0.70-0.75': [], '0.75-0.80': [], '0.80-0.90': [], '0.90+': []
    }
    for t in valid:
        p = t['ml_probability']
        pnl = t['pnl_percent']
        if   p < 0.60: buckets['0.50-0.60'].append(pnl)
        elif p < 0.65: buckets['0.60-0.65'].append(pnl)
        elif p < 0.70: buckets['0.65-0.70'].append(pnl)
        elif p < 0.75: buckets['0.70-0.75'].append(pnl)
        elif p < 0.80: buckets['0.75-0.80'].append(pnl)
        elif p < 0.90: buckets['0.80-0.90'].append(pnl)
        else:           buckets['0.90+'].append(pnl)

    bucket_stats = {}
    for label, pnls in buckets.items():
        if not pnls: continue
        arr = np.array(pnls)
        winners = arr[arr > 0]
        losers  = arr[arr < 0]
        wr = len(winners) / len(arr) * 100 if arr.size else 0
        bucket_stats[label] = {
            'n':       len(pnls),
            'win_rate': round(wr, 1),
            'avg_pnl':  round(arr.mean(), 2),
            'avg_win':  round(winners.mean(), 2) if winners.size else 0,
            'avg_loss': round(losers.mean(),  2) if losers.size  else 0,
        }

    # By timeframe
    tf_stats = defaultdict(list)
    for t in valid:
        tf_stats[t.get('timeframe', '?')].append(t['pnl_percent'])

    tf_summary = {}
    for tf, pnls in tf_stats.items():
        arr = np.array(pnls)
        winners = arr[arr > 0]
        wr = len(winners) / len(arr) * 100 if arr.size else 0
        tf_summary[tf] = {'n': len(pnls), 'win_rate': round(wr, 1), 'avg_pnl': round(arr.mean(), 2)}

    return {'by_ml_bucket': bucket_stats, 'by_timeframe': tf_summary, 'total_valid': len(valid)}


# ══════════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 70, flush=True)
    print("  TRADEORA COMPREHENSIVE BACKTEST ENGINE", flush=True)
    print("=" * 70, flush=True)

    all_prices, companies, fund_map = load_all_data()

    # Group prices by company
    by_co = defaultdict(list)
    active_ids = {co['id'] for co in companies}
    for r in all_prices:
        if r['company_id'] in active_ids and r.get('close_price'):
            by_co[r['company_id']].append(r)

    # Aggregate results across all companies
    agg = defaultdict(lambda: defaultdict(list))
    n_stocks = 0
    skipped  = 0

    print(f"\n🔄 Running backtest on {len(companies)} companies...", flush=True)

    for co in companies:
        cid = co['id']
        rows = by_co.get(cid, [])
        if not rows: continue

        df = build_company_candles(rows)
        if len(df) < MIN_CANDLES:
            skipped += 1
            continue

        try:
            df_sig = compute_signals(df, fund_map.get(cid, {}))
            co_results = run_backtest(df_sig)
            n_stocks += 1

            # Aggregate into global results
            for signal_name, stats in co_results.items():
                if stats.get('n_trades', 0) > 0:
                    agg[signal_name]['win_rate'].append(stats['win_rate'])
                    agg[signal_name]['avg_return'].append(stats['avg_return'])
                    agg[signal_name]['expectancy'].append(stats['expectancy'])
                    agg[signal_name]['rr_ratio'].append(stats['rr_ratio'])
                    agg[signal_name]['n_trades'].append(stats['n_trades'])
                    agg[signal_name]['sharpe'].append(stats['sharpe_proxy'])
        except Exception as e:
            skipped += 1

        if n_stocks % 30 == 0:
            print(f"   Processed {n_stocks} stocks...", flush=True)

    print(f"\n✅ Backtest complete: {n_stocks} stocks processed, {skipped} skipped", flush=True)

    # ── Compute final aggregated stats ────────────────────────────────────────
    final_results = {}
    for signal_name, data in agg.items():
        total_trades = sum(data['n_trades'])
        if total_trades == 0: continue
        final_results[signal_name] = {
            'total_trades':   total_trades,
            'avg_win_rate':   round(np.mean(data['win_rate']), 1),
            'avg_return_15d': round(np.mean(data['avg_return']), 2),
            'avg_expectancy': round(np.mean(data['expectancy']), 2),
            'avg_rr':         round(np.mean(data['rr_ratio']), 2),
            'avg_sharpe':     round(np.mean(data['sharpe']), 2),
        }

    # Sort by expectancy
    ranked = sorted(final_results.items(), key=lambda x: x[1]['avg_expectancy'], reverse=True)

    # ── Print Results Table ───────────────────────────────────────────────────
    print(f"\n{'='*70}", flush=True)
    print(f"  BACKTEST RESULTS – 15-Day Horizon | {n_stocks} Stocks", flush=True)
    print(f"{'='*70}", flush=True)
    print(f"{'Signal':<28} {'Trades':>7} {'WinRate':>8} {'AvgRet':>8} {'Expect':>8} {'R:R':>6} {'Sharpe':>7}", flush=True)
    print(f"{'-'*70}", flush=True)

    for name, stats in ranked:
        print(
            f"{name:<28} {stats['total_trades']:>7,} {stats['avg_win_rate']:>7.1f}% "
            f"{stats['avg_return_15d']:>+7.2f}% {stats['avg_expectancy']:>+7.2f}% "
            f"{stats['avg_rr']:>6.2f} {stats['avg_sharpe']:>7.2f}",
            flush=True
        )

    # ── Platform actual trade analysis ────────────────────────────────────────
    actual = analyze_actual_trades()

    print(f"\n{'='*70}", flush=True)
    print(f"  ACTUAL PLATFORM TRADES – Win Rate by ML Probability Bucket", flush=True)
    print(f"{'='*70}", flush=True)
    print(f"{'ML Bucket':<15} {'N':>6} {'WinRate':>9} {'AvgPnL':>9} {'AvgWin':>9} {'AvgLoss':>9}", flush=True)
    print(f"{'-'*70}", flush=True)
    for bucket, s in actual['by_ml_bucket'].items():
        print(f"{bucket:<15} {s['n']:>6} {s['win_rate']:>8.1f}% {s['avg_pnl']:>+8.2f}% {s['avg_win']:>+8.2f}% {s['avg_loss']:>+8.2f}%", flush=True)

    print(f"\n  ACTUAL PLATFORM TRADES – By Timeframe", flush=True)
    print(f"{'-'*50}", flush=True)
    for tf, s in sorted(actual['by_timeframe'].items(), key=lambda x: -x[1]['n']):
        print(f"  {tf:<25} N={s['n']:>4}  WR={s['win_rate']:>5.1f}%  AvgPnL={s['avg_pnl']:>+6.2f}%", flush=True)

    # ── Save full report ──────────────────────────────────────────────────────
    report = {
        'generated_at':       datetime.now(timezone.utc).isoformat(),
        'stocks_backtested':  n_stocks,
        'horizon_days':       15,
        'buy_threshold_pct':  BUY_THRESHOLD * 100,
        'sell_threshold_pct': SELL_THRESHOLD * 100,
        'signal_performance': {k: v for k, v in ranked},
        'actual_trades':      actual,
        'key_findings': {
            'best_signal':    ranked[0][0] if ranked else 'N/A',
            'best_expect':    ranked[0][1]['avg_expectancy'] if ranked else 0,
            'worst_signal':   ranked[-1][0] if ranked else 'N/A',
            'baseline_expect': final_results.get('buy_hold', {}).get('avg_expectancy', 0),
        }
    }

    out_path = Path(__file__).parent / 'backtest_results.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Full report saved to: {out_path}", flush=True)
    print(f"\n🏆 Best signal: {report['key_findings']['best_signal']} (expectancy: {report['key_findings']['best_expect']:+.2f}%)", flush=True)
    print(f"📊 Buy & Hold baseline: {report['key_findings']['baseline_expect']:+.2f}%", flush=True)


if __name__ == '__main__':
    main()
