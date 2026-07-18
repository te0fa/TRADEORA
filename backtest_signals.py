import os, math
import pandas as pd
import numpy as np
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
sb = create_client(os.getenv('SUPABASE_URL'),
                   os.getenv('SUPABASE_KEY'))

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
    closes = [c['close'] for c in candles]
    highs  = [c['high']  for c in candles]
    lows   = [c['low']   for c in candles]

    rsi_arr  = calc_rsi(closes, 14)
    hist_arr = calc_macd_hist(closes)
    sma20    = calc_sma(closes, 20)
    sma50    = calc_sma(closes, 50)

    results = {'buy': [], 'sell': []}

    start = max(50, 0)
    end   = len(candles) - lookahead - 1

    for i in range(start, end):
        rsi  = rsi_arr[i]
        hist = hist_arr[i]
        s20  = sma20[i]
        s50  = sma50[i]
        cl   = closes[i]

        if None in [rsi, hist, s20, s50]:
            continue

        # ── تحديد إشارة الشراء ──
        is_buy = (
            rsi > 45 and rsi < 72 and
            hist > 0 and
            cl > s20 and s20 > s50
        )
        # ── تحديد إشارة البيع ──
        is_sell = (
            rsi < 55 and rsi > 28 and
            hist < 0 and
            cl < s20 and s20 < s50
        )

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
            })

    # ── حساب الإحصاءات ──
    stats_rows = []
    for sig, data in results.items():
        total = len(data)
        if total < 5:
            continue
        tp1_hits = sum(1 for d in data if d['tp1'])
        tp2_hits = sum(1 for d in data if d['tp2'])
        b1 = [d['bars_tp1'] for d in data
              if d['bars_tp1'] is not None]
        b2 = [d['bars_tp2'] for d in data
              if d['bars_tp2'] is not None]
        stats_rows.append({
            'company_id':   company_id,
            'symbol':       symbol,
            'timeframe':    timeframe,
            'signal_type':  sig,
            'total_signals':total,
            'tp1_hits':     tp1_hits,
            'tp2_hits':     tp2_hits,
            'avg_bars_tp1': round(sum(b1)/len(b1), 2)
                            if b1 else None,
            'avg_bars_tp2': round(sum(b2)/len(b2), 2)
                            if b2 else None,
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
