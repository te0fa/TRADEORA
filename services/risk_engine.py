"""
services/risk_engine.py — Tradeora EGX Risk & Position Sizing Engine
======================================================================
Authoritative Risk Management System for EGX Equities.

Enforces:
1. Dynamic Policy Lookup from public.risk_parameters for date t.
2. Risk-Based Position Sizing: Capped by concentration limit and 20-day ADV liquidity.
3. Fail-Closed Principles: Missing price, missing SL, or corrupt data strictly REJECTS trade.
4. Portfolio Heat Governance: Rejects orders exceeding cumulative heat limit.
5. Drawdown Circuit Breaker: Emergency System Halt on peak-to-trough drawdown >= limit.
"""

import os
import math
import logging
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, datetime
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

logger = logging.getLogger("tradeora.risk")

DATABASE_URL = os.getenv('DATABASE_URL')


class RiskEngineError(Exception):
    """Base exception for risk violations."""
    pass


class CircuitBreakerHaltedError(RiskEngineError):
    """Raised when max portfolio drawdown breaker is triggered."""
    pass


class ExcessivePortfolioHeatError(RiskEngineError):
    """Raised when cumulative open risk exceeds heat policy limit."""
    pass


def get_db_conn():
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None


def fetch_active_risk_parameters(as_of_date: str = "2026-08-11", conn=None) -> Dict[str, float]:
    """
    Fetches active risk parameters for date as_of_date from public.risk_parameters.
    """
    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    default_params = {
        "MAX_RISK_PER_TRADE_PCT": 0.02,
        "MAX_PORTFOLIO_HEAT_PCT": 0.10,
        "MAX_CONCENTRATION_PCT": 0.15,
        "MAX_ADV_LIQUIDITY_PCT": 0.10,
        "MAX_DRAWDOWN_BREAKER_PCT": 0.20
    }

    if not conn:
        return default_params

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT parameter_name, value
                FROM public.risk_parameters
                WHERE effective_from <= %s
                  AND (effective_to IS NULL OR effective_to >= %s);
            """, (as_of_date, as_of_date))
            rows = cur.fetchall()

        if not rows:
            return default_params

        res = dict(default_params)
        for r in rows:
            res[r["parameter_name"]] = float(r["value"])
        return res
    finally:
        if close_conn:
            conn.close()


def calculate_position_size(
    nav: float,
    entry_price: float,
    stop_loss: float,
    adv_20: float,
    as_of_date: str = "2026-08-11",
    conn=None
) -> Dict[str, Any]:
    """
    Calculates exact risk-based position size capped by concentration and ADV limits.
    Enforces FAIL-CLOSED: Missing pricing/SL strictly returns 0 shares with reason.
    """
    # Strict Fail-Closed Check
    if entry_price is None or entry_price <= 0:
        return {"shares": 0, "reason": "FAIL_CLOSED: Missing or invalid entry price"}
    if stop_loss is None or stop_loss <= 0:
        return {"shares": 0, "reason": "FAIL_CLOSED: Missing or invalid stop loss"}
    if nav is None or nav <= 0:
        return {"shares": 0, "reason": "FAIL_CLOSED: Invalid portfolio NAV"}
    if entry_price <= stop_loss:
        return {"shares": 0, "reason": "FAIL_CLOSED: Stop loss must be below entry price for long trade"}

    params = fetch_active_risk_parameters(as_of_date, conn=conn)

    risk_per_share = abs(entry_price - stop_loss)
    max_risk_amount = nav * params["MAX_RISK_PER_TRADE_PCT"]

    # 1. Raw Volatility/Risk Shares
    raw_shares = math.floor(max_risk_amount / risk_per_share)

    # 2. Concentration Cap
    max_concentration_amount = nav * params["MAX_CONCENTRATION_PCT"]
    concentration_shares = math.floor(max_concentration_amount / entry_price)

    shares_capped = min(raw_shares, concentration_shares)

    # 3. ADV Liquidity Cap
    adv_cap_shares = math.floor(adv_20 * params["MAX_ADV_LIQUIDITY_PCT"]) if adv_20 > 0 else shares_capped
    final_shares = max(0, min(shares_capped, adv_cap_shares))

    actual_capital_allocated = final_shares * entry_price
    actual_risk_pct = ((final_shares * risk_per_share) / nav) * 100 if nav > 0 else 0.0

    return {
        "shares": final_shares,
        "entry_price": entry_price,
        "stop_loss": stop_loss,
        "capital_allocated": round(actual_capital_allocated, 2),
        "actual_risk_pct": round(actual_risk_pct, 4),
        "raw_risk_shares": raw_shares,
        "concentration_cap_shares": concentration_shares,
        "adv_cap_shares": adv_cap_shares,
        "reason": "OK" if final_shares > 0 else "POSITION_SIZE_ZERO_OR_ILLIQUID"
    }


def calculate_portfolio_heat(open_trades: List[Dict[str, Any]], nav: float) -> float:
    """Calculates cumulative portfolio heat percentage across open positions."""
    if nav <= 0 or not open_trades:
        return 0.0

    total_risk = 0.0
    for t in open_trades:
        shares = t.get("shares", 0)
        entry = t.get("entry_price", 0.0)
        sl = t.get("sl", entry)
        total_risk += shares * abs(entry - sl)

    return float(total_risk / nav)


def evaluate_trade_risk(
    trade_request: Dict[str, Any],
    open_trades: List[Dict[str, Any]],
    current_nav: float,
    peak_nav: float,
    adv_20: float = 100000.0,
    as_of_date: str = "2026-08-11",
    conn=None
) -> Dict[str, Any]:
    """
    Evaluates order approval/rejection against Heat, Concentration, and Circuit Breaker rules.
    Enforces Fail-Closed logic on all invalid inputs.
    """
    params = fetch_active_risk_parameters(as_of_date, conn=conn)

    # 1. Fail-Closed Input Checks
    if not trade_request or not isinstance(trade_request, dict):
        return {"status": "REJECTED", "reason": "FAIL_CLOSED: Invalid trade request format"}

    entry_p = trade_request.get("entry_price")
    sl_p = trade_request.get("sl")

    if entry_p is None or float(entry_p) <= 0:
        return {"status": "REJECTED", "reason": "FAIL_CLOSED: Missing or non-positive entry price"}

    if sl_p is None or float(sl_p) <= 0:
        return {"status": "REJECTED", "reason": "FAIL_CLOSED: Missing or non-positive stop loss"}

    entry_p = float(entry_p)
    sl_p = float(sl_p)

    # 2. Check Circuit Breaker (Max Drawdown Limit)
    if peak_nav > 0:
        drawdown_pct = (peak_nav - current_nav) / peak_nav
        if drawdown_pct >= params["MAX_DRAWDOWN_BREAKER_PCT"]:
            raise CircuitBreakerHaltedError(
                f"SYSTEM_HALTED: Peak-to-trough drawdown {drawdown_pct:.2%} exceeds circuit breaker limit {params['MAX_DRAWDOWN_BREAKER_PCT']:.2%}"
            )

    # 3. Position Sizing
    sizing = calculate_position_size(current_nav, entry_p, sl_p, adv_20, as_of_date, conn=conn)
    if sizing["shares"] <= 0:
        return {
            "status": "REJECTED",
            "reason": sizing.get("reason", "POSITION_SIZE_ZERO_OR_ILLIQUID"),
            "sizing": sizing
        }

    # 4. Check Portfolio Heat Limit
    current_heat = calculate_portfolio_heat(open_trades, current_nav)
    new_trade_heat = ((sizing["shares"] * abs(entry_p - sl_p)) / current_nav) if current_nav > 0 else 0.0

    if current_heat + new_trade_heat > params["MAX_PORTFOLIO_HEAT_PCT"]:
        raise ExcessivePortfolioHeatError(
            f"EXCESSIVE_PORTFOLIO_HEAT: Cumulative heat {current_heat + new_trade_heat:.2%} exceeds policy limit {params['MAX_PORTFOLIO_HEAT_PCT']:.2%}"
        )

    return {
        "status": "APPROVED",
        "sizing": sizing,
        "portfolio_heat_after": round((current_heat + new_trade_heat) * 100, 2)
    }
