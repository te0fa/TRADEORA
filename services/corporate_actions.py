"""
services/corporate_actions.py — Authoritative Corporate Action Accounting Engine
================================================================================
Strict implementation of CORPORATE_ACTION_SEMANTICS_DESIGN.md.

Handles:
- SPLIT / REVERSE_SPLIT
- BONUS_SHARES
- RIGHTS_ISSUE (Subscription Exercise)

Mathematical Guarantee:
Position Total Market/Book Value MUST BE 100% INVARIANT across non-cash corporate action events!
(e.g., 100 shares @ 50 EGP = 5,000 EGP  -->  2:1 Split  -->  200 shares @ 25 EGP = 5,000 EGP).
"""

import os
import logging
from datetime import date, datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

logger = logging.getLogger("tradeora.corporate_actions")


def adjust_position(
    quantity: float,
    cost_basis: float,
    action_type: str,
    ratio: float,
    subscription_price: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes exact post-event quantity, cost basis per share, and cash flow impact.
    
    Parameters:
      quantity: Existing number of shares (Q > 0)
      cost_basis: Cost basis per share (CB > 0)
      action_type: 'SPLIT' | 'REVERSE_SPLIT' | 'BONUS_SHARES' | 'RIGHTS_ISSUE'
      ratio: Multiplier or percentage ratio (e.g. 2.0 for 2:1 split, 0.5 for 1:2 reverse split, 0.10 for 10% bonus)
      subscription_price: EGP price per share for Rights Issue subscription
    
    Returns:
      {
        "new_quantity": float,
        "new_cost_basis": float,
        "cash_flow_impact": float, # 0.0 for split/bonus; positive for rights exercise outflow
        "total_book_value": float
      }
    """
    if quantity <= 0 or cost_basis <= 0 or ratio <= 0:
        raise ValueError(f"Invalid inputs: quantity={quantity}, cost_basis={cost_basis}, ratio={ratio}")

    action = action_type.upper().strip()

    if action in ('SPLIT', 'REVERSE_SPLIT'):
        # Q_new = Q * ratio, CB_new = CB / ratio
        new_q = quantity * ratio
        new_cb = cost_basis / ratio
        cash_impact = 0.0

    elif action == 'BONUS_SHARES':
        # ratio is bonus ratio (e.g., 0.10 for 10% bonus)
        new_q = quantity * (1.0 + ratio)
        new_cb = cost_basis / (1.0 + ratio)
        cash_impact = 0.0

    elif action == 'RIGHTS_ISSUE':
        # Subscription exercise
        if subscription_price is None or subscription_price < 0:
            raise ValueError("subscription_price is required and must be >= 0 for RIGHTS_ISSUE exercise")
        
        rights_qty = quantity * ratio
        cash_impact = rights_qty * subscription_price
        new_q = quantity + rights_qty
        orig_total_cost = quantity * cost_basis
        new_total_cost = orig_total_cost + cash_impact
        new_cb = new_total_cost / new_q

    else:
        raise ValueError(f"Unsupported action_type for non-dividend engine: {action_type}")

    total_value = new_q * new_cb

    return {
        "new_quantity": round(new_q, 4),
        "new_cost_basis": round(new_cb, 4),
        "cash_flow_impact": round(cash_impact, 2),
        "total_book_value": round(total_value, 2)
    }


def adjust_trade_price_targets(
    entry_price: float,
    tp1: Optional[float],
    tp2: Optional[float],
    sl: Optional[float],
    action_type: str,
    ratio: float
) -> Dict[str, Optional[float]]:
    """
    Adjusts active trade entry price and exit targets (TP1, TP2, SL) proportionally
    so that PnL percentage and risk-reward ratios remain 100% invariant.
    """
    action = action_type.upper().strip()
    if action in ('SPLIT', 'REVERSE_SPLIT'):
        adj_factor = 1.0 / ratio
    elif action == 'BONUS_SHARES':
        adj_factor = 1.0 / (1.0 + ratio)
    else:
        adj_factor = 1.0 / ratio

    new_entry = round(entry_price * adj_factor, 4)
    new_tp1 = round(tp1 * adj_factor, 4) if (tp1 is not None and tp1 > 0) else None
    new_tp2 = round(tp2 * adj_factor, 4) if (tp2 is not None and tp2 > 0) else None
    new_sl  = round(sl  * adj_factor, 4) if (sl  is not None and sl  > 0) else None

    return {
        "entry_price": new_entry,
        "tp1": new_tp1,
        "tp2": new_tp2,
        "sl": new_sl,
        "adjustment_factor": round(adj_factor, 6)
    }


def adjust_historical_series(
    closes: List[float],
    dates: List[str],
    ex_date: str,
    action_type: str,
    ratio: float
) -> List[float]:
    """
    Adjusts historical close prices preceding ex_date backwards to remove false technical gaps.
    """
    action = action_type.upper().strip()
    if action in ('SPLIT', 'REVERSE_SPLIT'):
        adj_factor = 1.0 / ratio
    elif action == 'BONUS_SHARES':
        adj_factor = 1.0 / (1.0 + ratio)
    else:
        adj_factor = 1.0 / ratio

    adjusted = []
    for d, c in zip(dates, closes):
        if d < ex_date:
            adjusted.append(round(c * adj_factor, 4))
        else:
            adjusted.append(c)

    return adjusted
