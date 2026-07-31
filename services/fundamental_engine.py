"""
Tradeora Fundamental Analysis & Valuation Engine
Evaluates stock fair values, valuation discounts, ROE profitability, debt safety, and dividend yields.
Computes a comprehensive Fundamental Health Score (0 - 100) and ML Confidence Boosts.
"""

from typing import Dict, Any, Optional

def calculate_fundamental_score(co_fund: Dict[str, Any], current_price: Optional[float] = None) -> Dict[str, Any]:
    """
    Computes a comprehensive 4-component Fundamental Health & Valuation Score (0 - 100):
    1. Valuation Subscore (35 pts): Price vs Fair Value discount, P/E ratio.
    2. Profitability Subscore (30 pts): Return on Equity (ROE) & Net Profit Margin.
    3. Financial Health Subscore (20 pts): Debt-to-Equity ratio & liquidity.
    4. Dividend Subscore (15 pts): Dividend Yield & Sustainability.
    """
    if not co_fund:
        return {
            'has_data': False,
            'total_score': 50,
            'tier_ar': '⚖️ متوازنة',
            'fundamental_boost': 0.0,
            'badge_ar': None,
            'summary_ar': 'بيانات مالية غير مكتملة'
        }

    try:
        fair_value = co_fund.get('fair_value')
        upside = co_fund.get('upside_potential')
        pe_ratio = co_fund.get('pe_ratio')
        pb_ratio = co_fund.get('price_to_book')
        div_yield = co_fund.get('dividend_yield')
        roe = co_fund.get('roe')
        margin = co_fund.get('net_profit_margin')
        debt_to_equity = co_fund.get('debt_to_equity')

        # Compute upside potential if fair value and current price are provided
        if upside is None and fair_value and current_price and current_price > 0:
            upside = round(((fair_value - current_price) / current_price) * 100, 1)

        # ── 1. Valuation Subscore (Max 35 pts) ──
        val_score = 15.0 # Default baseline
        if upside is not None:
            if upside >= 30.0:
                val_score = 35.0
            elif upside >= 20.0:
                val_score = 30.0
            elif upside >= 10.0:
                val_score = 22.0
            elif upside >= 0.0:
                val_score = 15.0
            elif upside >= -15.0:
                val_score = 8.0
            else:
                val_score = 0.0 # Severely overvalued
        elif pe_ratio is not None and pe_ratio > 0:
            if pe_ratio <= 6.0:
                val_score = 30.0
            elif pe_ratio <= 10.0:
                val_score = 22.0
            elif pe_ratio <= 16.0:
                val_score = 15.0
            else:
                val_score = 5.0

        # ── 2. Profitability Subscore (Max 30 pts) ──
        prof_score = 15.0
        roe_val = roe if roe is not None else 12.0
        margin_val = margin if margin is not None else 10.0

        if roe_val >= 20.0:
            prof_score = 30.0
        elif roe_val >= 14.0:
            prof_score = 24.0
        elif roe_val >= 8.0:
            prof_score = 18.0
        elif roe_val >= 0.0:
            prof_score = 10.0
        else:
            prof_score = 0.0 # Negative ROE loss maker

        # ── 3. Financial Health & Debt Subscore (Max 20 pts) ──
        health_score = 12.0
        debt_val = debt_to_equity if debt_to_equity is not None else 0.6
        if debt_val <= 0.3:
            health_score = 20.0
        elif debt_val <= 0.7:
            health_score = 16.0
        elif debt_val <= 1.2:
            health_score = 10.0
        else:
            health_score = 2.0 # High debt risk

        # ── 4. Dividend Subscore (Max 15 pts) ──
        div_score = 5.0
        yield_val = div_yield if div_yield is not None else 0.0
        if yield_val >= 10.0:
            div_score = 15.0
        elif yield_val >= 6.0:
            div_score = 12.0
        elif yield_val >= 3.0:
            div_score = 8.0
        else:
            div_score = 3.0

        total_score = round(val_score + prof_score + health_score + div_score, 1)
        total_score = min(100.0, max(0.0, total_score))

        # Classify Fundamental Tier
        if total_score >= 80.0:
            tier_ar = '💎 ممتازة (نمو وقيمة)'
            fundamental_boost = 0.12 # +12% ML boost
        elif total_score >= 65.0:
            tier_ar = '📈 جيدة جداً'
            fundamental_boost = 0.07 # +7% ML boost
        elif total_score >= 45.0:
            tier_ar = '⚖️ متوازنة'
            fundamental_boost = 0.0
        elif total_score >= 30.0:
            tier_ar = '⚠️ ضعيفة مالياً'
            fundamental_boost = -0.06 # -6% penalty
        else:
            tier_ar = '🚨 مخاطر مالية متضخمة'
            fundamental_boost = -0.12 # -12% penalty

        # Dynamic Badge Creation
        badge_ar = None
        if upside is not None and upside >= 20.0:
            badge_ar = f'💎 خصم {int(upside)}% عن القيمة العادلة'
        elif yield_val >= 8.0:
            badge_ar = f'💰 عائد توزيعات قوي {yield_val}%'
        elif roe_val >= 18.0:
            badge_ar = f'🛡️ كفاءة أرباح ممتازة ROE {int(roe_val)}%'
        elif total_score >= 75.0:
            badge_ar = '💎 أساسيات مالية جبارة'
        elif upside is not None and upside <= -20.0:
            badge_ar = '⚠️ سهم متضخم أعلى من قيمته العادلة'

        return {
            'has_data': True,
            'total_score': total_score,
            'tier_ar': tier_ar,
            'fundamental_boost': fundamental_boost,
            'badge_ar': badge_ar,
            'fair_value': fair_value,
            'upside_potential': upside,
            'pe_ratio': pe_ratio,
            'dividend_yield': div_yield,
            'roe': roe_val,
            'debt_to_equity': debt_val
        }

    except Exception as e:
        print(f"Fundamental score calculation error: {e}")

    return {
        'has_data': False,
        'total_score': 50,
        'tier_ar': '⚖️ متوازنة',
        'fundamental_boost': 0.0,
        'badge_ar': None,
        'summary_ar': 'خطأ في معالجة البيانات'
    }
