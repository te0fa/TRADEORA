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

def simulate_strategies():
    print("Loading companies list...", flush=True)
    companies = sb.table('companies').select('id, symbol').limit(30).execute().data
    if not companies:
        print("No companies found.")
        return
        
    print(f"Loaded {len(companies)} companies. Fetching historical daily prices for simulation sample...", flush=True)
    
    total_trades_old = 0
    total_trades_new = 0
    win_count_old = 0
    win_count_new = 0
    pnl_sum_old = 0.0
    pnl_sum_new = 0.0
    
    improvement_saves = 0  # Stopped in old but hit TP1 in new
    worse_drawdown = 0     # Hit SL in both but new had a bigger loss
    
    for co in companies:
        cid, sym = co['id'], co['symbol']
        rows = sb.table('market_prices')\
                 .select('open_price, high_price, low_price, close_price, volume')\
                 .eq('company_id', cid)\
                 .order('price_date')\
                 .execute().data
                 
        if len(rows) < 100:
            continue
            
        candles = [{
            'open': float(r['open_price']) if r['open_price'] else float(r['close_price']),
            'high': float(r['high_price']) if r['high_price'] else float(r['close_price']),
            'low': float(r['low_price']) if r['low_price'] else float(r['close_price']),
            'close': float(r['close_price']),
            'volume': int(r['volume']) if r['volume'] else 0
        } for r in rows if r['close_price']]
        
        closes = [c['close'] for c in candles]
        highs = [c['high'] for c in candles]
        lows = [c['low'] for c in candles]
        
        # Calculate ATR, SMA, Bollinger Bands, RSI, MACD
        # For simplicity of exact parity matching the logic in components/stock/PriceChart.tsx:
        from talib_simulated import calc_sma, calc_ema, calc_rsi_custom, calc_bb, calc_macd_custom
        
        rsi_arr = calc_rsi_custom(closes, 14)
        atr_arr = calc_atr(candles, 14)
        sma20 = calc_sma(closes, 20)
        sma50 = calc_sma(closes, 50)
        macd_hist = calc_macd_custom(closes)
        bb_upper, bb_middle, bb_lower = calc_bb(closes, 20, 2)
        
        # S/R Levels approximation
        for i in range(50, len(candles) - 30):
            # Bullish Trigger
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
            sr_sl_val = entry_price * 0.965 # Fallback support
            
            sl_options = sorted([bb_sl_val, rsi_sl_val, macd_sl_val, ma_sl_val, sr_sl_val])
            
            # Old SL (Median)
            sl_old = sl_options[2]
            
            # New SL (25th percentile + 0.3 * ATR buffer)
            # 25th percentile of 5 items is the second item (index 1)
            sl_new = sl_options[1] - (current_atr * 0.3)
            
            # Targets (TP1 and TP2)
            tp1_price = entry_price * 1.035
            tp2_price = entry_price * 1.07
            
            # Evaluate outcomes for next 30 candles
            future_window = candles[i+1 : i+31]
            
            # Old Strategy Evaluation (Instant Touch SL)
            stopped_old = False
            tp1_hit_old = False
            for fc in future_window:
                if fc['low'] <= sl_old:
                    stopped_old = True
                    break
                if fc['high'] >= tp1_price:
                    tp1_hit_old = True
                    break
                    
            # New Strategy Evaluation (Close Candle below SL)
            stopped_new = False
            tp1_hit_new = False
            for fc in future_window:
                if fc['close'] < sl_new:
                    stopped_new = True
                    break
                if fc['high'] >= tp1_price:
                    tp1_hit_new = True
                    break
            
            # Stats updates
            total_trades_old += 1
            if tp1_hit_old and not stopped_old:
                win_count_old += 1
                pnl_sum_old += 3.5
            elif stopped_old:
                pnl_sum_old -= ((entry_price - sl_old) / entry_price * 100)
                
            total_trades_new += 1
            if tp1_hit_new and not stopped_new:
                win_count_new += 1
                pnl_sum_new += 3.5
            elif stopped_new:
                pnl_sum_new -= ((entry_price - sl_new) / entry_price * 100)
                
            # Compare cases
            if stopped_old and tp1_hit_new and not stopped_new:
                improvement_saves += 1
            elif stopped_old and stopped_new and sl_new < sl_old:
                worse_drawdown += 1
                
    print("\n================ BACKTEST SIMULATION RESULTS ================")
    print(f"Total simulated recommendation signals: {total_trades_old}")
    print(f"--- Old Stop Loss Strategy (Median SL + Touch Trigger):")
    print(f"    Win Rate (TP1): {win_count_old / total_trades_old * 100:.2f}% ({win_count_old} wins)")
    print(f"    Average Return: {pnl_sum_old / total_trades_old:.2f}%")
    print(f"--- New Stop Loss Strategy (25th percentile - 0.3*ATR + Close Trigger):")
    print(f"    Win Rate (TP1): {win_count_new / total_trades_new * 100:.2f}% ({win_count_new} wins)")
    print(f"    Average Return: {pnl_sum_new / total_trades_new:.2f}%")
    print(f"-------------------------------------------------------------")
    print(f"💡 Saved by New Stop Loss (Avoided fakeout, hit TP1): {improvement_saves} trades")
    print(f"⚠️ Bigger losses in real downtrend (Hit deeper SL): {worse_drawdown} trades")
    print(f"Net Win-Rate Improvement: +{(win_count_new - win_count_old) / total_trades_old * 100:.2f}%")
    print("=============================================================")

if __name__ == '__main__':
    # Inline mock helpers
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
            # Signal
            signal = [None] * len(macd)
            start = 26 + 9
            if len(macd) >= start:
                macd_clean = [m for m in macd if m is not None]
                sig_clean = TalibSimulated.calc_ema(macd_clean, 9)
                diff = len(macd) - len(sig_clean)
                signal = [None]*diff + sig_clean
            hist = [(a - b) if a is not None and b is not None else None for a, b in zip(macd, signal)]
            return hist
            
    sys.modules['talib_simulated'] = TalibSimulated
    simulate_strategies()
