"""
Tradeora Quantitative Engine - Wyckoff Accumulation & Price Channels Service
Detects Wyckoff Phase C Spring (False Breakdown) and Upthrust (False Breakout) setups,
calculates dynamic linear regression price channels, and computes ML confidence score boosts.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, Tuple

def detect_wyckoff_spring(df: pd.DataFrame, window: int = 30) -> Dict[str, Any]:
    """
    Detects Wyckoff Phase C Spring (False Breakdown under support with long lower wick and volume surge).
    """
    if df is None or len(df) < window + 5:
        return {'is_spring': False, 'confidence_boost': 0.0, 'details': None}

    try:
        # Standardize column names
        cols = {c.lower(): c for c in df.columns}
        high_col = cols.get('high', 'High')
        low_col = cols.get('low', 'Low')
        close_col = cols.get('close', 'Close')
        open_col = cols.get('open', 'Open')
        vol_col = cols.get('volume', 'Volume')

        # Recent slice
        recent = df.tail(window + 5).copy().reset_index(drop=True)
        latest_idx = len(recent) - 1
        latest = recent.iloc[latest_idx]

        # 1. Support Level over prior window (excluding latest 2 candles)
        prior_slice = recent.iloc[:-2]
        support_level = prior_slice[low_col].min()

        # 2. Check for Spring Candle (latest or 1 candle back)
        for idx in range(latest_idx - 1, latest_idx + 1):
            row = recent.iloc[idx]
            low_val = float(row[low_col])
            close_val = float(row[close_col])
            open_val = float(row[open_col])
            high_val = float(row[high_col])
            vol_val = float(row[vol_col])

            candle_range = max(0.001, high_val - low_val)
            body_min = min(open_val, close_val)
            lower_wick = max(0.0, body_min - low_val)
            lower_wick_ratio = lower_wick / candle_range

            # Volume SMA 20
            vol_sma = prior_slice[vol_col].tail(20).mean()
            vol_ratio = vol_val / max(1.0, vol_sma) if vol_sma > 0 else 1.0

            # Spring Criteria:
            # - Low dipped below prior support level (False breakdown)
            # - Close recovered back ABOVE support level (or within 0.5% of it)
            # - Long lower wick >= 55% of candle range
            # - Volume surge >= 1.25x average volume
            if (low_val < support_level * 0.998 and 
                close_val >= support_level * 0.995 and 
                lower_wick_ratio >= 0.55 and 
                vol_ratio >= 1.25):

                return {
                    'is_spring': True,
                    'confidence_boost': 0.15, # +15% ML confidence score boost
                    'spring_low': round(low_val, 2),
                    'support_level': round(support_level, 2),
                    'lower_wick_ratio': round(lower_wick_ratio * 100, 1),
                    'volume_surge_ratio': round(vol_ratio, 2),
                    'badge_ar': '🏛️ تجميع وايكوف مؤسسي (Spring)',
                    'badge_en': '🏛️ Wyckoff Institutional Spring'
                }

    except Exception as e:
        print(f"Wyckoff Spring detection error: {e}")

    return {'is_spring': False, 'confidence_boost': 0.0, 'details': None}


def detect_wyckoff_upthrust(df: pd.DataFrame, window: int = 30) -> Dict[str, Any]:
    """
    Detects Wyckoff Phase C Upthrust (False Breakout above resistance with long upper wick).
    """
    if df is None or len(df) < window + 5:
        return {'is_upthrust': False, 'details': None}

    try:
        cols = {c.lower(): c for c in df.columns}
        high_col = cols.get('high', 'High')
        low_col = cols.get('low', 'Low')
        close_col = cols.get('close', 'Close')
        open_col = cols.get('open', 'Open')

        recent = df.tail(window + 5).copy().reset_index(drop=True)
        latest_idx = len(recent) - 1
        prior_slice = recent.iloc[:-2]
        resistance_level = prior_slice[high_col].max()

        for idx in range(latest_idx - 1, latest_idx + 1):
            row = recent.iloc[idx]
            high_val = float(row[high_col])
            close_val = float(row[close_col])
            open_val = float(row[open_col])
            low_val = float(row[low_col])

            candle_range = max(0.001, high_val - low_val)
            body_max = max(open_val, close_val)
            upper_wick = max(0.0, high_val - body_max)
            upper_wick_ratio = upper_wick / candle_range

            if (high_val > resistance_level * 1.002 and 
                close_val <= resistance_level * 1.005 and 
                upper_wick_ratio >= 0.55):

                return {
                    'is_upthrust': True,
                    'upthrust_high': round(high_val, 2),
                    'resistance_level': round(resistance_level, 2),
                    'badge_ar': '⚠️ توزيع وايكوف علوي (Upthrust)',
                    'badge_en': '⚠️ Wyckoff Distribution Upthrust'
                }

    except Exception as e:
        print(f"Wyckoff Upthrust detection error: {e}")

    return {'is_upthrust': False, 'details': None}


def calculate_price_channels(df: pd.DataFrame, window: int = 40) -> Dict[str, Any]:
    """
    Calculates dynamic linear regression Price Channels (Upper Ceiling, Lower Floor, Median Line),
    classifies Ascending vs Descending channels, and detects Channel Ceiling Breakouts and Floor Breakdowns.
    """
    if df is None or len(df) < window:
        return {'channel_valid': False, 'upper': None, 'lower': None, 'median': None}

    try:
        cols = {c.lower(): c for c in df.columns}
        close_col = cols.get('close', 'Close')
        high_col = cols.get('high', 'High')
        low_col = cols.get('low', 'Low')
        vol_col = cols.get('volume', 'Volume')

        recent = df.tail(window).copy().reset_index(drop=True)
        y = recent[close_col].values
        x = np.arange(len(y))

        # Linear regression slope and intercept
        slope, intercept = np.polyfit(x, y, 1)

        trendline = slope * x + intercept
        std_dev = np.std(y - trendline)

        # 2 Standard Deviation Channel boundaries
        upper_channel = trendline + (1.8 * std_dev)
        lower_channel = trendline - (1.8 * std_dev)

        latest_close = float(recent[close_col].iloc[-1])
        latest_upper = float(upper_channel[-1])
        latest_lower = float(lower_channel[-1])
        latest_median = float(trendline[-1])

        # Volume Ratio
        vol_vals = recent[vol_col].values if vol_col in recent.columns else [1.0]*window
        latest_vol = float(vol_vals[-1])
        vol_sma = np.mean(vol_vals[-20:]) if len(vol_vals) >= 20 else 1.0
        vol_ratio = latest_vol / max(1.0, vol_sma)

        # Channel Classifications
        is_ascending = slope > 0.0001
        is_descending = slope < -0.0001

        # Breakout & Breakdown Detection
        is_channel_breakout = (latest_close > latest_upper * 1.002) and (vol_ratio >= 1.25)
        is_channel_breakdown = latest_close < latest_lower * 0.998
        is_at_channel_floor = abs(latest_close - latest_lower) / max(0.01, latest_close) * 100 <= 2.5

        # Badges
        badge_ar = None
        if is_channel_breakout:
            badge_ar = '🚀 اختراق سقف القناة الصاعدة' if is_ascending else '🚀 اختراق سقف القناة'
        elif is_channel_breakdown:
            badge_ar = '🚨 كسر أرضية القناة'
        elif is_ascending and is_at_channel_floor:
            badge_ar = '📊 شراء من قاع القناة الصاعدة'
        elif is_ascending:
            badge_ar = '📊 قناة سعرية صاعدة'
        elif is_descending:
            badge_ar = '📉 قناة سعرية هابطة'

        confidence_boost = 0.0
        if is_channel_breakout:
            confidence_boost = 0.12 # +12% ML boost for channel breakout
        elif is_ascending and is_at_channel_floor:
            confidence_boost = 0.10 # +10% ML boost for ascending floor bounce

        return {
            'channel_valid': True,
            'upper': round(latest_upper, 2),
            'lower': round(latest_lower, 2),
            'median': round(latest_median, 2),
            'slope_direction': 'UP' if is_ascending else ('DOWN' if is_descending else 'FLAT'),
            'is_ascending': is_ascending,
            'is_descending': is_descending,
            'is_channel_breakout': is_channel_breakout,
            'is_channel_breakdown': is_channel_breakdown,
            'is_at_channel_floor': is_at_channel_floor,
            'confidence_boost': confidence_boost,
            'badge_ar': badge_ar
        }

    except Exception as e:
        print(f"Price channels calculation error: {e}")

    return {'channel_valid': False, 'upper': None, 'lower': None, 'median': None}


def get_wyckoff_confluence_score(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Combines Wyckoff Spring and Price Channel scores into a total ML confidence boost.
    """
    spring_res = detect_wyckoff_spring(df)
    upthrust_res = detect_wyckoff_upthrust(df)
    channel_res = calculate_price_channels(df)

    total_boost = 0.0
    if spring_res.get('is_spring'):
        total_boost += spring_res.get('confidence_boost', 0.15)
    if channel_res.get('is_at_channel_floor'):
        total_boost += channel_res.get('confidence_boost', 0.10)

    # Cap total boost at +20%
    total_boost = min(0.20, total_boost)

    return {
        'total_boost': total_boost,
        'spring': spring_res,
        'upthrust': upthrust_res,
        'channel': channel_res
    }

if __name__ == '__main__':
    # Test script on synthetic price action
    prices = [10.0, 9.8, 9.5, 9.2, 8.8, 8.5, 8.4, 8.45, 8.2, 7.9, 8.3, 8.6, 8.9, 9.2, 9.5]
    vols = [1000, 1100, 1200, 1050, 900, 950, 1100, 1000, 900, 2800, 2500, 2100, 1800, 1900, 2000]
    test_df = pd.DataFrame({
        'Open': [p * 1.01 for p in prices],
        'High': [p * 1.03 for p in prices],
        'Low': [p * 0.97 if i != 9 else 7.5 for i, p in enumerate(prices)],
        'Close': prices,
        'Volume': vols
    })
    res = get_wyckoff_confluence_score(test_df)
    print("Wyckoff Engine Test Result:", res)
