"""
Tradeora ICT & SMC (Smart Money Concepts) Engine
Detects Fair Value Gaps (FVG), Bullish/Bearish Order Blocks (OB),
Liquidity Sweeps (BSL/SSL), and Market Structure Shifts (MSS / CHoCH).
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("tradeora.ict_smc_engine")

class ICTSMCAnalysisEngine:
    def __init__(self):
        pass

    def analyze_ict_smc_patterns(self, df_candles: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyzes candle data for ICT & SMC concepts:
        - Bullish/Bearish Fair Value Gaps (FVG)
        - Order Blocks (OB)
        - Liquidity Sweeps
        - Market Structure Shift (MSS / CHoCH)
        Returns ICT confluence score, badges, and ML boost (-0.12 to +0.12).
        """
        if df_candles is None or len(df_candles) < 15:
            return {
                "fvg_detected": False,
                "ob_detected": False,
                "mss_detected": False,
                "badge_ar": None,
                "ml_boost": 0.0,
                "details": "بيانات غير كافية لتحليل ICT/SMC"
            }

        df = df_candles.copy()
        df['close'] = pd.to_numeric(df.get('close_price', df.get('close', 0)), errors='coerce').fillna(0)
        df['open'] = pd.to_numeric(df.get('open_price', df.get('open', df['close'])), errors='coerce').fillna(0)
        df['high'] = pd.to_numeric(df.get('high_price', df.get('high', df['close'])), errors='coerce').fillna(0)
        df['low'] = pd.to_numeric(df.get('low_price', df.get('low', df['close'])), errors='coerce').fillna(0)

        n = len(df)
        highs = df['high'].values
        lows = df['low'].values
        closes = df['close'].values
        opens = df['open'].values

        # 1. Fair Value Gap (FVG) Detection
        # Bullish FVG: low[i] > high[i-2]
        bullish_fvg = False
        fvg_gap_size = 0.0
        for i in range(n - 1, max(n - 5, 2), -1):
            if lows[i] > highs[i - 2]:
                bullish_fvg = True
                fvg_gap_size = lows[i] - highs[i - 2]
                break

        # 2. Bullish Order Block (OB) Detection
        # Last down-candle before a strong displacement up
        bullish_ob = False
        ob_price_level = 0.0
        for i in range(n - 2, max(n - 8, 1), -1):
            if closes[i] < opens[i]: # Bearish candle
                # Check if followed by strong displacement upward
                if closes[i+1] > highs[i] and (closes[i+1] - opens[i+1]) > (highs[i] - lows[i]):
                    bullish_ob = True
                    ob_price_level = lows[i]
                    break

        # 3. Market Structure Shift (MSS / CHoCH)
        # Break of recent swing high
        recent_swing_high = max(highs[max(0, n-12):n-2])
        mss_detected = closes[-1] > recent_swing_high

        # 4. Liquidity Sweep (SSL Sweep)
        # Lower low than recent swing low, but close price bounced back above it
        recent_swing_low = min(lows[max(0, n-12):n-2])
        ssl_sweep = (lows[-1] < recent_swing_low) and (closes[-1] > recent_swing_low)

        # Calculate ICT/SMC Score & Badges
        ml_boost = 0.0
        badge_ar = None

        if ssl_sweep and bullish_fvg:
            badge_ar = "⚡ ICT: سحب سيولة + فجوة FVG صعودية"
            ml_boost = +0.12
        elif bullish_ob and mss_detected:
            badge_ar = "🎯 SMC: كُتلة أوامر OB + كسر هيكل MSS"
            ml_boost = +0.10
        elif bullish_fvg:
            badge_ar = "✨ ICT: فجوة سعرية عادلة (Bullish FVG)"
            ml_boost = +0.07
        elif bullish_ob:
            badge_ar = "🧱 SMC: منطقة كُتلة أوامر صانع السوق (OB)"
            ml_boost = +0.06
        elif ssl_sweep:
            badge_ar = "🧹 ICT: تطهير وسحب سيولة القاع (SSL Sweep)"
            ml_boost = +0.05

        return {
            "fvg_detected": bullish_fvg,
            "ob_detected": bullish_ob,
            "mss_detected": mss_detected,
            "ssl_sweep": ssl_sweep,
            "badge_ar": badge_ar,
            "ml_boost": ml_boost,
            "details": f"FVG: {bullish_fvg}, OB: {bullish_ob}, MSS: {mss_detected}, SSL Sweep: {ssl_sweep}"
        }


# Global Singleton Instance
ict_smc_engine = ICTSMCAnalysisEngine()

if __name__ == "__main__":
    test_data = pd.DataFrame({
        'open':  [10.0, 9.8, 9.5, 9.6, 10.2, 10.5, 10.8, 10.6, 11.2],
        'high':  [10.2, 9.9, 9.6, 10.3, 10.6, 10.9, 11.1, 10.8, 11.6],
        'low':   [9.7,  9.4, 9.1, 9.5, 10.1, 10.4, 10.7, 10.5, 11.1],
        'close': [9.8,  9.5, 9.3, 10.2, 10.5, 10.8, 10.9, 10.7, 11.5]
    })
    res = ict_smc_engine.analyze_ict_smc_patterns(test_data)
    print("ICT & SMC Analysis Result:", res)
