import os
import sys
import time
import numpy as np
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Load env credentials
load_dotenv(dotenv_path=Path('tradeora-web/.env.local'))
sb = create_client(os.getenv('NEXT_PUBLIC_SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Standard ATR calculations
def calc_atr(candles, period=14):
    if len(candles) < 2: return [0] * len(candles)
    trs = []
    for i in range(1, len(candles)):
        high = candles[i]['high'] if candles[i]['high'] is not None else candles[i]['close']
        low = candles[i]['low'] if candles[i]['low'] is not None else candles[i]['close']
        prev_close = candles[i-1]['close']
        tr = max(
            high - low,
            abs(high - prev_close),
            abs(low - prev_close)
        )
        trs.append(tr)
    atrs = [0]
    for i in range(len(trs)):
        if i < period - 1:
            atrs.append(0)
            continue
        slice_tr = trs[i - period + 1 : i + 1]
        atrs.append(sum(slice_tr) / period)
    return atrs

class TalibSimulated:
    @staticmethod
    def calc_sma(data, n):
        res = [None] * len(data)
        for i in range(n-1, len(data)):
            res[i] = sum(data[i-n+1:i+1]) / n
        return res
        
    @staticmethod
    def calc_ema(data, n):
        res = [None] * len(data)
        k = 2 / (n + 1)
        res[n-1] = sum(data[:n]) / n
        for i in range(n, len(data)):
            res[i] = data[i] * k + res[i-1] * (1-k)
        return res
        
    @staticmethod
    def calc_rsi_custom(closes, period=14):
        rsi = [None] * len(closes)
        gains, losses = [], []
        for i in range(1, len(closes)):
            d = closes[i] - closes[i-1]
            gains.append(max(d, 0))
            losses.append(max(-d, 0))
        if len(gains) < period: return rsi
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
        
    @staticmethod
    def calc_bb(closes, period=20, std=2):
        sma = TalibSimulated.calc_sma(closes, period)
        upper = [None] * len(closes)
        lower = [None] * len(closes)
        for i in range(period-1, len(closes)):
            slice_val = closes[i-period+1 : i+1]
            val_std = np.std(slice_val)
            upper[i] = sma[i] + std * val_std
            lower[i] = sma[i] - std * val_std
        return upper, sma, lower
        
    @staticmethod
    def calc_macd_custom(closes):
        ema12 = TalibSimulated.calc_ema(closes, 12)
        ema26 = TalibSimulated.calc_ema(closes, 26)
        macd = [(a - b) if a and b else None for a, b in zip(ema12, ema26)]
        signal = [None] * len(macd)
        start = 26 + 9
        if len(macd) >= start:
            macd_clean = [m for m in macd if m is not None]
            sig_clean = TalibSimulated.calc_ema(macd_clean, 9)
            diff = len(macd) - len(sig_clean)
            signal = [None]*diff + sig_clean
        hist = [(a - b) if a is not None and b is not None else None for a, b in zip(macd, signal)]
        return hist

def run_simulation(timeframe='1d', candles_source='supabase'):
    # Load candles based on timeframe
    candles_by_company = {}
    
    if timeframe == '1d':
        print(f"Loading 1d candles from Supabase...", flush=True)
        companies = sb.table('companies').select('id, symbol').limit(30).execute().data
        for co in companies:
            cid, sym = co['id'], co['symbol']
            rows = sb.table('market_prices')\
                     .select('open_price, high_price, low_price, close_price, volume')\
                     .eq('company_id', cid)\
                     .order('price_date')\
                     .execute().data
            if len(rows) >= 100:
                candles_by_company[sym] = [{
                    'open': float(r['open_price']) if r['open_price'] else float(r['close_price']),
                    'high': float(r['high_price']) if r['high_price'] else float(r['close_price']),
                    'low': float(r['low_price']) if r['low_price'] else float(r['close_price']),
                    'close': float(r['close_price']),
                    'volume': int(r['volume']) if r['volume'] else 0
                } for r in rows if r['close_price']]
    else:
        # Load from local Parquet backup for intraday fimeframes
        parquet_path = Path('data/historical_exports') / f"export_tradingview_{timeframe}.parquet"
        print(f"Loading {timeframe} candles from local parquet: {parquet_path}...", flush=True)
        if not parquet_path.exists():
            print(f"Parquet file {parquet_path} not found.")
            return
        df = pd.read_parquet(parquet_path)
        companies = sb.table('companies').select('id, symbol').execute().data
        companies_map = {c['id']: c['symbol'] for c in companies}
        
        for cid, sym in companies_map.items():
            df_comp = df[df['company_id'] == cid].sort_values('snapshot_time')
            if len(df_comp) >= 100:
                candles_by_company[sym] = [{
                    'open': float(r['open_price']) if r['open_price'] is not None else float(r['price']),
                    'high': float(r['high_price']) if r['high_price'] is not None else float(r['price']),
                    'low': float(r['low_price']) if r['low_price'] is not None else float(r['price']),
                    'close': float(r['price']),
                    'volume': int(r['volume']) if r['volume'] is not None else 0
                } for _, r in df_comp.iterrows()]

    # Run simulations
    total_trades = 0
    
    # Outcomes lists to aggregate stats
    wins_a, wins_b, wins_c = 0, 0, 0
    losses_a, losses_b, losses_c = [], [], []
    
    for sym, candles in candles_by_company.items():
        closes = [c['close'] for c in candles]
        highs = [c['high'] for c in candles]
        lows = [c['low'] for c in candles]
        
        rsi_arr = TalibSimulated.calc_rsi_custom(closes, 14)
        atr_arr = calc_atr(candles, 14)
        sma20 = TalibSimulated.calc_sma(closes, 20)
        sma50 = TalibSimulated.calc_sma(closes, 50)
        macd_hist = TalibSimulated.calc_macd_custom(closes)
        bb_upper, bb_middle, bb_lower = TalibSimulated.calc_bb(closes, 20, 2)
        
        # We search for signals
        for i in range(50, len(candles) - 30):
            rsi = rsi_arr[i]
            hist = macd_hist[i]
            s20 = sma20[i]
            s50 = sma50[i]
            cl = closes[i]
            
            if rsi is None or hist is None or s20 is None or s50 is None:
                continue
                
            is_buy = rsi > 45 and rsi < 72 and hist > 0 and cl > s20 and s20 > s50
            if not is_buy:
                continue
                
            entry_price = cl
            current_atr = atr_arr[i] if atr_arr[i] > 0 else (entry_price * 0.015)
            
            # BB, RSI, MACD, MA, SR stops
            bb_sl_val = bb_lower[i] if bb_lower[i] is not None else (entry_price * 0.965)
            rsi_sl_val = entry_price - 1.5 * current_atr
            macd_sl_val = entry_price - 1.2 * current_atr
            ma_sl_val = min(s20, s50) * 0.995
            sr_sl_val = entry_price * 0.965
            
            sl_options = sorted([bb_sl_val, rsi_sl_val, macd_sl_val, ma_sl_val, sr_sl_val])
            
            sl_old = sl_options[2] # Old SL (Median)
            sl_new = sl_options[1] - (current_atr * 0.3) # New SL (25th percentile + ATR buffer)
            
            tp1_price = entry_price * (1.015 if timeframe != '1d' else 1.035)
            
            future_window = candles[i+1 : i+31]
            
            # A) Old Strategy: Median stop + Touch trigger
            stopped_a = False
            tp1_hit_a = False
            for fc in future_window:
                if fc['low'] <= sl_old:
                    stopped_a = True
                    break
                if fc['high'] >= tp1_price:
                    tp1_hit_a = True
                    break
                    
            # B) Close Trigger only: Median stop + Close trigger
            stopped_b = False
            tp1_hit_b = False
            for fc in future_window:
                if fc['close'] < sl_old:
                    stopped_b = True
                    break
                if fc['high'] >= tp1_price:
                    tp1_hit_b = True
                    break
                    
            # C) Both: 25th percentile + ATR buffer + Close trigger
            stopped_c = False
            tp1_hit_c = False
            for fc in future_window:
                if fc['close'] < sl_new:
                    stopped_c = True
                    break
                if fc['high'] >= tp1_price:
                    tp1_hit_c = True
                    break
            
            # Aggregate stats
            total_trades += 1
            if tp1_hit_a and not stopped_a:
                wins_a += 1
            elif stopped_a:
                losses_a.append((entry_price - sl_old) / entry_price * 100)
                
            if tp1_hit_b and not stopped_b:
                wins_b += 1
            elif stopped_b:
                losses_b.append((entry_price - sl_old) / entry_price * 100)
                
            if tp1_hit_c and not stopped_c:
                wins_c += 1
            elif stopped_c:
                losses_c.append((entry_price - sl_new) / entry_price * 100)
                
    print(f"\nTimeframe: {timeframe} | Total Simulated Trades: {total_trades}")
    print("| Scenario | Win Rate % | Avg Return (PnL) % | Avg Loss on stopped % |")
    print("|---|---|---|---|")
    
    avg_loss_a = sum(losses_a) / len(losses_a) if losses_a else 0
    pnl_a = (wins_a * (3.5 if timeframe == '1d' else 1.5) - sum(losses_a)) / total_trades if total_trades else 0
    print(f"| A) Old (Median + Touch) | {wins_a/total_trades*100:.2f}% | {pnl_a:.2f}% | -{avg_loss_a:.2f}% |")
    
    avg_loss_b = sum(losses_b) / len(losses_b) if losses_b else 0
    pnl_b = (wins_b * (3.5 if timeframe == '1d' else 1.5) - sum(losses_b)) / total_trades if total_trades else 0
    print(f"| B) Close trigger only (Median + Close) | {wins_b/total_trades*100:.2f}% | {pnl_b:.2f}% | -{avg_loss_b:.2f}% |")
    
    avg_loss_c = sum(losses_c) / len(losses_c) if losses_c else 0
    pnl_c = (wins_c * (3.5 if timeframe == '1d' else 1.5) - sum(losses_c)) / total_trades if total_trades else 0
    print(f"| C) Both (25th% + ATR + Close) | {wins_c/total_trades*100:.2f}% | {pnl_c:.2f}% | -{avg_loss_c:.2f}% |")
    print()

if __name__ == '__main__':
    run_simulation('1d')
    run_simulation('1h')
