import os, math
import pandas as pd
import numpy as np
import pandas_ta as ta
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)

# ── مؤشرات فنية ────────────────────────

def calc_rsi(closes: list, period=14) -> list:
    rsi = [None] * len(closes)
    gains, losses = [], []
    for i in range(1, len(closes)):
        d = closes[i] - closes[i-1]
        gains.append(max(d, 0))
        losses.append(max(-d, 0))
    if len(gains) < period:
        return rsi
    avg_g = sum(gains[:period]) / period
    avg_l = sum(losses[:period]) / period
    for i in range(period, len(closes)):
        if i > period:
            g = gains[i-1]
            l = losses[i-1]
            avg_g = (avg_g * (period-1) + g) / period
            avg_l = (avg_l * (period-1) + l) / period
        rs = avg_g / avg_l if avg_l != 0 else 100
        rsi[i] = 100 - (100 / (1 + rs))
    return rsi

def calc_macd_hist(closes: list) -> list:
    def ema(data, n):
        result = [None] * len(data)
        k = 2 / (n + 1)
        start = next((i for i, v in enumerate(data)
                      if v is not None), None)
        if start is None: return result
        result[start] = data[start]
        for i in range(start+1, len(data)):
            result[i] = data[i] * k + result[i-1] * (1-k)
        return result
    ema12 = ema(closes, 12)
    ema26 = ema(closes, 26)
    macd = [
        (a - b) if a and b else None
        for a, b in zip(ema12, ema26)
    ]
    signal = ema(macd, 9)
    hist = [
        (a - b) if a is not None and b is not None else None
        for a, b in zip(macd, signal)
    ]
    return hist

def calc_sma(closes: list, n: int) -> list:
    result = [None] * len(closes)
    for i in range(n-1, len(closes)):
        result[i] = sum(closes[i-n+1:i+1]) / n
    return result

# ── دالة الـ Backtest ───────────────────

def backtest_symbol(symbol: str, company_id: str,
                    candles: list, timeframe: str,
                    tp_pct: float, tp2_pct: float,
                    sl_pct: float, lookahead: int):
    """
    candles: list of dicts {close, high, low, open}
    tp_pct / tp2_pct / sl_pct: نسب الهدف والوقف
    lookahead: عدد شموع المستقبل للفحص
    """
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

    ema50_s = df.ta.ema(length=50)
    ema200_s = df.ta.ema(length=200)
    ema50 = ema50_s.values.flatten().tolist() if ema50_s is not None else [None] * len(candles)
    ema200 = ema200_s.values.flatten().tolist() if ema200_s is not None else [None] * len(candles)

    closes = [c['close'] for c in candles]
    highs  = [c['high']  for c in candles]
    lows   = [c['low']   for c in candles]

    rsi_arr  = calc_rsi(closes, 14)
    hist_arr = calc_macd_hist(closes)
    sma20    = calc_sma(closes, 20)
    sma50_arr = calc_sma(closes, 50)

    results = {'buy': [], 'sell': []}

    start = max(50, 0)
    end   = len(candles) - lookahead - 1

    for i in range(start, end):
        rsi  = rsi_arr[i]
        hist = hist_arr[i]
        s20  = sma20[i]
        s50  = sma50_arr[i]
        cl   = closes[i]

        if None in [rsi, hist, s20, s50]:
            continue

        # ── حساب حالة السوق للفلترة ──
        adx_val = adx_list[i] if (i < len(adx_list) and adx_list[i] is not None and not np.isnan(adx_list[i])) else 0.0
        pdi_val = plus_di[i] if (i < len(plus_di) and plus_di[i] is not None and not np.isnan(plus_di[i])) else 0.0
        ndi_val = minus_di[i] if (i < len(minus_di) and minus_di[i] is not None and not np.isnan(minus_di[i])) else 0.0

        ema_crossover = False
        if i >= 15:
            diffs = []
            for j in range(i-15, i+1):
                e50_val = ema50[j]
                e200_val = ema200[j]
                if e50_val is not None and e200_val is not None and not np.isnan(e50_val) and not np.isnan(e200_val):
                    diffs.append(e50_val - e200_val)
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

        # Traditional conditions
        traditional_buy = (
            rsi > 45 and rsi < 72 and
            hist > 0 and
            cl > s20 and s20 > s50
        )
        traditional_sell = (
            rsi < 55 and rsi > 28 and
            hist < 0 and
            cl < s20 and s20 < s50
        )

        # ── تحديد إشارة الشراء المعدلة ──
        is_buy = False
        if traditional_buy:
            if regime == 1.0:
                is_buy = True  # Trending Up: Entry allowed
            elif regime == 0.0:
                # Range-bound: Stricter oscillator conditions
                is_buy = (rsi > 45 and rsi < 55)

        # ── تحديد إشارة البيع المعدلة ──
        is_sell = False
        if traditional_sell:
            if regime == -1.0:
                is_sell = True  # Trending Down: Exit/Short allowed
            elif regime == 0.0:
                # Range-bound: Stricter oscillator conditions
                is_sell = (rsi < 55 and rsi > 45)

        for signal, flag in [('buy', is_buy),
                              ('sell', is_sell)]:
            if not flag:
                continue

            entry = cl
            if signal == 'buy':
                tp1_price = entry * (1 + tp_pct)
                tp2_price = entry * (1 + tp2_pct)
                sl_price  = entry * (1 - sl_pct)
            else:
                tp1_price = entry * (1 - tp_pct)
                tp2_price = entry * (1 - tp2_pct)
                sl_price  = entry * (1 + sl_pct)

            tp1_hit = False
            tp2_hit = False
            bars_tp1 = None
            bars_tp2 = None
            stopped  = False

            future = candles[i+1 : i+1+lookahead]
            for j, fc in enumerate(future):
                fh, fl = fc['high'], fc['low']
                if signal == 'buy':
                    if fl <= sl_price:
                        stopped = True; break
                    if not tp1_hit and fh >= tp1_price:
                        tp1_hit = True
                        bars_tp1 = j + 1
                    if not tp2_hit and fh >= tp2_price:
                        tp2_hit = True
                        bars_tp2 = j + 1
                        break
                else:
                    if fh >= sl_price:
                        stopped = True; break
                    if not tp1_hit and fl <= tp1_price:
                        tp1_hit = True
                        bars_tp1 = j + 1
                    if not tp2_hit and fl <= tp2_price:
                        tp2_hit = True
                        bars_tp2 = j + 1
                        break

            results[signal].append({
                'tp1': tp1_hit,
                'tp2': tp2_hit,
                'bars_tp1': bars_tp1,
                'bars_tp2': bars_tp2,
                'stopped': stopped,
                'regime': regime
            })

    # ── حساب الإحصاءات وطباعة تقرير مقارن ──
    stats_rows = []
    for sig, data in results.items():
        total = len(data)
        if total < 5:
            continue
        tp1_hits = sum(1 for d in data if d['tp1'])
        tp2_hits = sum(1 for d in data if d['tp2'])
        b1 = [d['bars_tp1'] for d in data if d['bars_tp1'] is not None]
        b2 = [d['bars_tp2'] for d in data if d['bars_tp2'] is not None]
        
        # Breakdown stats by regime
        regimes_in_data = [d['regime'] for d in data]
        trending_signals = [d for d in data if d['regime'] in [1.0, -1.0]]
        range_signals = [d for d in data if d['regime'] == 0.0]
        
        print(f"\n      --- [{symbol}] [{timeframe}] [{sig}] Regime Performance breakdown ---", flush=True)
        print(f"      إجمالي الإشارات: {total} | Trending: {len(trending_signals)} | Range-bound: {len(range_signals)}", flush=True)
        
        if trending_signals:
            t_tp1 = sum(1 for d in trending_signals if d['tp1'])
            print(f"      [Trending Regime] Win rate TP1: {t_tp1/len(trending_signals)*100:.1f}%", flush=True)
        if range_signals:
            r_tp1 = sum(1 for d in range_signals if d['tp1'])
            print(f"      [Range Regime] Win rate TP1: {r_tp1/len(range_signals)*100:.1f}%", flush=True)

        stats_rows.append({
            'company_id':   company_id,
            'symbol':       symbol,
            'timeframe':    timeframe,
            'signal_type':  sig,
            'total_signals':total,
            'tp1_hits':     tp1_hits,
            'tp2_hits':     tp2_hits,
            'avg_bars_tp1': round(sum(b1)/len(b1), 2) if b1 else None,
            'avg_bars_tp2': round(sum(b2)/len(b2), 2) if b2 else None,
            'win_rate_tp1': round(tp1_hits/total*100, 2),
            'win_rate_tp2': round(tp2_hits/total*100, 2),
        })
    return stats_rows

# ── Main ────────────────────────────────

def main():
    companies = sb.table('companies')\
                  .select('id, symbol')\
                  .execute().data
    print(f"بدء Backtest لـ {len(companies)} شركة...")

    TIMEFRAMES = {
        '1d': {
            'source': 'daily',
            'tp': 0.035, 'tp2': 0.07,
            'sl': 0.035, 'look': 30
        },
        '15m': {
            'source': 'intraday',
            'tp': 0.015, 'tp2': 0.03,
            'sl': 0.01,  'look': 20
        },
        '1h': {
            'source': 'intraday',
            'tp': 0.02, 'tp2': 0.04,
            'sl': 0.015, 'look': 20
        },
        '4h': {
            'source': 'intraday',
            'tp': 0.025, 'tp2': 0.05,
            'sl': 0.02,  'look': 20
        },
    }

    for i, co in enumerate(companies):
        sym = co['symbol']
        cid = co['id']
        print(f"\n[{i+1}/{len(companies)}] {sym}", flush=True)

        for tf, cfg in TIMEFRAMES.items():
            candles = []

            if cfg['source'] == 'daily':
                rows = sb.table('market_prices')\
                    .select('open_price,high_price,'
                            'low_price,close_price')\
                    .eq('company_id', cid)\
                    .order('price_date')\
                    .execute().data
                candles = [{
                    'open':  r['open_price']  or r['close_price'],
                    'high':  r['high_price']  or r['close_price'],
                    'low':   r['low_price']   or r['close_price'],
                    'close': r['close_price'],
                } for r in rows if r['close_price']]

            else:  # intraday
                src = f'tradingview_{tf}'
                rows = sb.table('intraday_snapshots')\
                    .select('open_price,high_price,'
                            'low_price,price')\
                    .eq('company_id', cid)\
                    .eq('source', src)\
                    .order('snapshot_time')\
                    .execute().data
                candles = [{
                    'open':  r['open_price']  or r['price'],
                    'high':  r['high_price']  or r['price'],
                    'low':   r['low_price']   or r['price'],
                    'close': r['price'],
                } for r in rows if r['price']]

            if len(candles) < 60:
                continue

            rows_to_upsert = backtest_symbol(
                symbol=sym, company_id=cid,
                candles=candles, timeframe=tf,
                tp_pct=cfg['tp'], tp2_pct=cfg['tp2'],
                sl_pct=cfg['sl'], lookahead=cfg['look']
            )

            if rows_to_upsert:
                sb.table('signal_stats')\
                  .upsert(rows_to_upsert,
                          on_conflict='company_id,'
                                      'timeframe,signal_type')\
                  .execute()
                for r in rows_to_upsert:
                    print(f"  {tf} {r['signal_type']}: "
                          f"{r['total_signals']} إشارة "
                          f"→ Win% TP1={r['win_rate_tp1']}% "
                          f"TP2={r['win_rate_tp2']}%", flush=True)

    print("\n✅ Backtest اكتمل!", flush=True)

if __name__ == '__main__':
    main()
