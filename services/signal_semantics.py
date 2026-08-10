"""
services/signal_semantics.py — Tradeora EGX Signal Semantics & Intraday Governance Engine
==========================================================================================
Establishes mathematically rigorous signal classification and governance:

1. Signal Classification Rules:
   - BUY: P(BUY) >= buy_threshold (default 0.60)
   - NEUTRAL / HOLD: low_threshold <= P(BUY) < buy_threshold (default 0.35 <= P(BUY) < 0.60)
   - NO SIGNAL: P(BUY) < low_threshold (strictly maps to NEUTRAL / HOLD, NEVER fake SELL)
   - SELL / SHORT: Explicitly blocked unless an independently trained Short model exists.
   - EXIT: Governed strictly by position exit rules (TP1, TP2, SL, Stale Cleanup), segregated from Entry logic.

2. Intraday Production Governance:
   - Intraday production execution is strictly DISABLED based on documented live performance (-5.25% loss across 253 live trades).
   - Logic is preserved for Phase 10 research & backtesting with documented requirements for reactivation.
"""

import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("tradeora.signal_semantics")

BUY_PROBABILITY_THRESHOLD = 0.60
NEUTRAL_PROBABILITY_LOW = 0.35

INTRADAY_GOVERNANCE = {
    "status": "DISABLED",
    "reason": "LIVE_LOSS_REGRESSION: Intraday execution generated -5.25% net loss across 253 live trades.",
    "historical_performance": {
        "net_pnl_pct": -5.25,
        "sample_trades": 253
    },
    "requirements_for_reactivation": [
        "Phase 10 OOS Walk-Forward backtest proof",
        "Statistically significant positive Sharpe ratio (> 1.2)",
        "Formal risk & model committee approval"
    ]
}


def classify_entry_signal(
    ml_probability: float,
    has_trained_short_model: bool = False,
    buy_threshold: float = BUY_PROBABILITY_THRESHOLD,
    neutral_low: float = NEUTRAL_PROBABILITY_LOW
) -> Dict[str, Any]:
    """
    Classifies ML predictions into valid trade entry semantics.
    Enforces strict rule: Low P(BUY) <= 0.35 is NEUTRAL/HOLD, NEVER a fake SELL.
    """
    if ml_probability is None:
        return {
            "signal": "NEUTRAL",
            "action": "HOLD",
            "reason": "INSUFFICIENT_DATA_OR_NULL_PROBABILITY",
            "ml_probability": None
        }

    prob = float(ml_probability)

    if prob >= buy_threshold:
        return {
            "signal": "BUY",
            "action": "ENTER_LONG",
            "reason": f"BUY_PROBABILITY_EXCEEDS_THRESHOLD ({prob:.4f} >= {buy_threshold:.2f})",
            "ml_probability": prob
        }

    elif prob < neutral_low:
        # Low P(BUY) DOES NOT EQUAL SELL!
        if has_trained_short_model:
            return {
                "signal": "SELL",
                "action": "ENTER_SHORT",
                "reason": f"INDEPENDENT_SHORT_MODEL_TRIGGERED (P(BUY)={prob:.4f})",
                "ml_probability": prob
            }
        else:
            return {
                "signal": "NEUTRAL",
                "action": "HOLD",
                "reason": f"LOW_BUY_PROBABILITY_IS_NEUTRAL ({prob:.4f} <= {neutral_low:.2f}). No directional Short model trained.",
                "ml_probability": prob
            }

    else: # neutral_low <= prob < buy_threshold
        return {
            "signal": "NEUTRAL",
            "action": "HOLD",
            "reason": f"PROBABILITY_IN_NEUTRAL_ZONE ({neutral_low:.2f} <= {prob:.4f} < {buy_threshold:.2f})",
            "ml_probability": prob
        }


def check_intraday_production_status() -> Dict[str, Any]:
    """Returns intraday production governance status."""
    return INTRADAY_GOVERNANCE
