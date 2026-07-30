"""
Tradeora Quantitative Engine - Classical Chart Patterns Service
Detects Cup & Handle, Double Bottom (W-Pattern), and Bull Flags on EGX stock price data.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

def detect_cup_and_handle(df: pd.DataFrame, window: int = 50) -> Dict[str, Any]:
    """
    Detects Cup & Handle chart pattern (U-shaped rounding bottom followed by a handle).
    """
    if df is None or len(df) < window:
        return {'is_cup_and_handle': False, 'confidence_boost': 0.0, 'details': None}

    try:
        cols = {c.lower(): c for c in df.columns}
        close_col = cols.get('close', 'Close')
        high_col = cols.get('high', 'High')
        low_col = cols.get('low', 'Low')

        recent = df.tail(window).copy().reset_index(drop=True)
        closes = recent[close_col].values
        highs = recent[high_col].values
        lows = recent[low_col].values

        n = len(closes)
        left_rim_idx = 0
        left_rim_price = highs[:10].max()

        # Find cup bottom (lowest point in middle 60% of window)
        mid_start, mid_end = int(n * 0.2), int(n * 0.8)
        cup_bottom_idx = mid_start + np.argmin(lows[mid_start:mid_end])
        cup_bottom_price = lows[cup_bottom_idx]

        # Right rim (peak after cup bottom)
        right_rim_idx = cup_bottom_idx + np.argmax(highs[cup_bottom_idx:-5])
        right_rim_price = highs[right_rim_idx]

        # Handle depth (pullback in last 5-8 candles)
        handle_slice = closes[right_rim_idx:]
        handle_min = handle_slice.min() if len(handle_slice) > 0 else right_rim_price

        # Cup Depth Criteria:
        # - Left and Right rims are within 5% height of each other
        # - Cup bottom depth is at least 6% below left rim
        # - Handle pullback is shallow (not retracing more than 40% of cup depth)
        cup_depth = left_rim_price - cup_bottom_price
        rim_diff_pct = abs(left_rim_price - right_rim_price) / left_rim_price * 100

        if (cup_depth / left_rim_price >= 0.06 and
            rim_diff_pct <= 5.0 and
            (right_rim_price - handle_min) <= 0.45 * cup_depth):

            return {
                'is_cup_and_handle': True,
                'confidence_boost': 0.12, # +12% ML boost
                'left_rim': round(float(left_rim_price), 2),
                'cup_bottom': round(float(cup_bottom_price), 2),
                'right_rim': round(float(right_rim_price), 2),
                'badge_ar': '☕ نموذج الكوب والعروة (مستهدف صعود)',
                'badge_en': '☕ Cup & Handle Pattern'
            }

    except Exception as e:
        print(f"Cup and Handle detection error: {e}")

    return {'is_cup_and_handle': False, 'confidence_boost': 0.0, 'details': None}


def detect_double_bottom(df: pd.DataFrame, window: int = 40) -> Dict[str, Any]:
    """
    Detects Double Bottom (W-Pattern) with two distinct troughs near the same support.
    """
    if df is None or len(df) < window:
        return {'is_double_bottom': False, 'confidence_boost': 0.0, 'details': None}

    try:
        cols = {c.lower(): c for c in df.columns}
        low_col = cols.get('low', 'Low')
        high_col = cols.get('high', 'High')

        recent = df.tail(window).copy().reset_index(drop=True)
        lows = recent[low_col].values
        highs = recent[high_col].values

        n = len(lows)
        half = n // 2

        trough1_idx = np.argmin(lows[:half])
        trough1_price = lows[trough1_idx]

        trough2_idx = half + np.argmin(lows[half:])
        trough2_price = lows[trough2_idx]

        # Intervening peak (neckline)
        neckline_idx = trough1_idx + np.argmax(highs[trough1_idx:trough2_idx])
        neckline_price = highs[neckline_idx]

        # Criteria:
        # - Troughs are within 2.5% of each other
        # - Troughs are separated by at least 8 candles
        # - Neckline peak is at least 4% above the troughs
        troughs_diff_pct = abs(trough1_price - trough2_price) / trough1_price * 100
        neckline_height_pct = (neckline_price - trough1_price) / trough1_price * 100

        if (troughs_diff_pct <= 2.5 and
            (trough2_idx - trough1_idx) >= 8 and
            neckline_height_pct >= 4.0):

            return {
                'is_double_bottom': True,
                'confidence_boost': 0.10, # +10% ML boost
                'trough1': round(float(trough1_price), 2),
                'trough2': round(float(trough2_price), 2),
                'neckline': round(float(neckline_price), 2),
                'badge_ar': '📉 W قاع مزدوج مؤكد',
                'badge_en': '📉 Double Bottom W-Pattern'
            }

    except Exception as e:
        print(f"Double Bottom detection error: {e}")

    return {'is_double_bottom': False, 'confidence_boost': 0.0, 'details': None}


def detect_bull_flag(df: pd.DataFrame, window: int = 25) -> Dict[str, Any]:
    """
    Detects Bull Flag pattern (Impulsive pole gain >= 5% followed by tight flag consolidation).
    """
    if df is None or len(df) < window:
        return {'is_bull_flag': False, 'confidence_boost': 0.0, 'details': None}

    try:
        cols = {c.lower(): c for c in df.columns}
        close_col = cols.get('close', 'Close')

        recent = df.tail(window).copy().reset_index(drop=True)
        closes = recent[close_col].values

        # Pole (candles 0 to 10): price rise >= 5%
        pole_start = closes[0]
        pole_end = closes[10]
        pole_gain_pct = (pole_end - pole_start) / pole_start * 100

        # Flag (candles 10 to end): tight consolidation, close within 3% range
        flag_slice = closes[10:]
        flag_max = flag_slice.max()
        flag_min = flag_slice.min()
        flag_range_pct = (flag_max - flag_min) / flag_min * 100

        if pole_gain_pct >= 5.0 and flag_range_pct <= 4.0 and closes[-1] >= flag_min:
            return {
                'is_bull_flag': True,
                'confidence_boost': 0.08, # +8% ML boost
                'pole_gain_pct': round(pole_gain_pct, 1),
                'flag_range_pct': round(flag_range_pct, 1),
                'badge_ar': '🚩 راية صاعدة ممتدة',
                'badge_en': '🚩 Bull Flag Continuation'
            }

    except Exception as e:
        print(f"Bull Flag detection error: {e}")

    return {'is_bull_flag': False, 'confidence_boost': 0.0, 'details': None}


def get_pattern_confluence_score(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Combines all classical chart patterns into a total ML confidence boost.
    """
    cup_res = detect_cup_and_handle(df)
    w_res = detect_double_bottom(df)
    flag_res = detect_bull_flag(df)

    total_boost = 0.0
    active_badge_ar = None

    if cup_res.get('is_cup_and_handle'):
        total_boost += cup_res.get('confidence_boost', 0.12)
        active_badge_ar = cup_res.get('badge_ar')
    elif w_res.get('is_double_bottom'):
        total_boost += w_res.get('confidence_boost', 0.10)
        active_badge_ar = w_res.get('badge_ar')
    elif flag_res.get('is_bull_flag'):
        total_boost += flag_res.get('confidence_boost', 0.08)
        active_badge_ar = flag_res.get('badge_ar')

    total_boost = min(0.15, total_boost)

    return {
        'total_boost': total_boost,
        'active_badge_ar': active_badge_ar,
        'cup': cup_res,
        'double_bottom': w_res,
        'bull_flag': flag_res
    }

if __name__ == '__main__':
    prices = [10.0, 9.5, 9.0, 8.5, 8.2, 8.5, 9.0, 9.5, 9.8, 9.6, 9.7, 10.2, 10.5]
    test_df = pd.DataFrame({'Close': prices, 'High': [p * 1.02 for p in prices], 'Low': [p * 0.98 for p in prices]})
    print("Patterns Engine Test Result:", get_pattern_confluence_score(test_df))
