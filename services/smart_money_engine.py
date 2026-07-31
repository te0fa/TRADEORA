"""
Tradeora Smart Money & Institutional Flow Engine
Analyzes Volume Spreads, Institutional Accumulation/Distribution, Block Trades,
and Multi-Level Money Flow (Stock Level, Sector Level, Market-Wide Level).
"""

import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("tradeora.smart_money")

class SmartMoneyEngine:
    def __init__(self):
        pass

    def calculate_smart_money_score(self, df_candles: pd.DataFrame, sector_name: str = None) -> Dict[str, Any]:
        """
        Analyzes candle series for Institutional Accumulation vs Retail Distribution.
        Returns smart_money_score (0 to 100), flow_type, badge_ar, and ML boost (-0.10 to +0.10).
        """
        if df_candles is None or len(df_candles) < 10:
            return {
                "smart_money_score": 50.0,
                "flow_type": "neutral",
                "badge_ar": None,
                "ml_boost": 0.0,
                "details": "بيانات غير كافية لتحليل السيولة"
            }

        df = df_candles.copy()
        df['volume'] = pd.to_numeric(df.get('volume', 0), errors='coerce').fillna(0)
        df['close'] = pd.to_numeric(df.get('close_price', df.get('close', 0)), errors='coerce').fillna(0)
        df['open'] = pd.to_numeric(df.get('open_price', df.get('open', df['close'])), errors='coerce').fillna(0)
        df['high'] = pd.to_numeric(df.get('high_price', df.get('high', df['close'])), errors='coerce').fillna(0)
        df['low'] = pd.to_numeric(df.get('low_price', df.get('low', df['close'])), errors='coerce').fillna(0)

        vol_20 = df['volume'].rolling(20, min_periods=5).mean().iloc[-1]
        last_vol = df['volume'].iloc[-1]
        last_close = df['close'].iloc[-1]
        last_open = df['open'].iloc[-1]
        last_high = df['high'].iloc[-1]
        last_low = df['low'].iloc[-1]

        vol_ratio = (last_vol / vol_20) if vol_20 > 0 else 1.0
        price_change_pct = ((last_close - last_open) / last_open * 100) if last_open > 0 else 0
        spread = last_high - last_low

        score = 50.0
        badge_ar = None
        ml_boost = 0.0
        flow_type = "neutral"

        # 1. Institutional Accumulation (تجميع مؤسسي)
        # High Volume Ratio (>= 2.0x) + Bullish Price Action
        if vol_ratio >= 2.2 and price_change_pct > 0.8:
            score = min(85.0 + (vol_ratio * 3), 98.0)
            flow_type = "institutional_accumulation"
            badge_ar = "🏦 تجميع مؤسسي كثيف"
            ml_boost = +0.10
        elif vol_ratio >= 1.5 and price_change_pct > 0.3:
            score = 72.0
            flow_type = "moderate_accumulation"
            badge_ar = "📈 تدفق سيولة إيجابي"
            ml_boost = +0.05

        # 2. Institutional Distribution (تصريف مؤسسي)
        # High Volume Ratio (>= 2.0x) + Bearish Price Action or Heavy Upper Shadow
        elif vol_ratio >= 2.2 and price_change_pct < -0.8:
            score = max(15.0 - (vol_ratio * 3), 2.0)
            flow_type = "institutional_distribution"
            badge_ar = "⚠️ تصريف مؤسسي حذر"
            ml_boost = -0.10
        elif vol_ratio >= 1.5 and price_change_pct < -0.3:
            score = 30.0
            flow_type = "moderate_distribution"
            badge_ar = "📉 ضغط مبيعات كبرى"
            ml_boost = -0.05

        # 3. Absorption / Volume Spread Anomaly (اختناق أحجام التداول)
        upper_wick = last_high - max(last_close, last_open)
        body = abs(last_close - last_open)
        if vol_ratio >= 2.0 and upper_wick > (body * 1.5) and price_change_pct > 0:
            badge_ar = "🛡️ امتصاص سيولة عند القمة"
            ml_boost = +0.03

        return {
            "smart_money_score": round(score, 1),
            "vol_ratio_20d": round(vol_ratio, 2),
            "flow_type": flow_type,
            "badge_ar": badge_ar,
            "ml_boost": ml_boost,
            "details": f"نسبة الأحجام مقارنة بمتوسط 20 يوم: {vol_ratio:.2f}x"
        }


# Global Singleton Instance
smart_money_engine = SmartMoneyEngine()

if __name__ == "__main__":
    test_data = pd.DataFrame({
        'close': [10.0, 10.1, 10.2, 10.15, 10.3, 10.25, 10.4, 10.35, 10.5, 11.2],
        'open': [9.9, 10.0, 10.1, 10.2, 10.1, 10.3, 10.2, 10.4, 10.3, 10.5],
        'high': [10.1, 10.2, 10.3, 10.25, 10.4, 10.35, 10.5, 10.45, 10.6, 11.3],
        'low': [9.8, 9.95, 10.0, 10.1, 10.0, 10.2, 10.1, 10.3, 10.2, 10.4],
        'volume': [1000, 1100, 950, 1050, 1200, 1150, 1000, 1050, 1100, 3500]
    })
    res = smart_money_engine.calculate_smart_money_score(test_data, "العقارات")
    print("Smart Money Analysis Result:", res)
