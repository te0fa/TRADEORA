"""
services/performance_analytics.py — Authoritative Performance Analytics Engine
================================================================================
Calculates mathematically sound portfolio performance metrics:

Conventions:
1. Daily Return Frequency: R_t = (E_t - E_{t-1}) / E_{t-1}
2. Annualization Factor: 252 EGX Trading Days per Year.
3. Time-Versioned Risk-Free Rate: Queried dynamically per date t from public.risk_free_rate_history.
4. Sharpe Ratio Correctness:
   - Daily Inputs: (Mean(R_t - R_{f,t}) / Std(R_t)) * sqrt(252)
   - Annualized Inputs: (R_annual - R_{f,annual}) / Std_annual (NO double sqrt(252) multiplication!).
5. Sortino Ratio: Uses Downside Deviation of negative excess returns.
6. Benchmark Comparison: EGX30 Total Return Index.
"""

import os
import math
import numpy as np
import logging
from decimal import Decimal, ROUND_HALF_UP
from datetime import date, datetime
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

logger = logging.getLogger("tradeora.performance_analytics")

DATABASE_URL = os.getenv('DATABASE_URL')
TRADING_DAYS_PER_YEAR = 252


def get_db_conn():
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None


def fetch_historical_risk_free_rates(dates: List[str], conn=None) -> Dict[str, float]:
    """
    Fetches exact annualized risk-free rates for given dates from public.risk_free_rate_history.
    Falls back to latest available historical rate if date is before first entry.
    """
    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    default_rate = 0.2250 # 22.50% default fallback if no DB connection
    res = {}

    if not conn:
        for d in dates:
            res[d] = default_rate
        return res

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            for d in dates:
                cur.execute("""
                    SELECT rate
                    FROM public.risk_free_rate_history
                    WHERE effective_date <= %s
                    ORDER BY effective_date DESC
                    LIMIT 1;
                """, (d,))
                row = cur.fetchone()
                if row:
                    res[d] = float(row["rate"])
                else:
                    res[d] = default_rate
        return res
    finally:
        if close_conn:
            conn.close()


def calculate_daily_returns(equity_series: List[float]) -> List[float]:
    """Calculates percentage daily returns: R_t = (E_t - E_{t-1}) / E_{t-1}."""
    if len(equity_series) < 2:
        return []

    returns = []
    for i in range(1, len(equity_series)):
        prev = equity_series[i-1]
        curr = equity_series[i]
        if prev > 0:
            returns.append((curr - prev) / prev)
        else:
            returns.append(0.0)
    return returns


def calculate_sharpe_ratio(
    returns: List[float],
    risk_free_rates_annual: List[float],
    frequency: str = "daily",
    annualized_volatility: Optional[float] = None
) -> float:
    """
    Calculates Sharpe Ratio with explicit frequency guards to prevent double-annualization.
    """
    if not returns:
        return 0.0

    ret_arr = np.array(returns)

    if frequency == "daily":
        if len(returns) < 2:
            return 0.0
        # Convert annual risk-free rates to daily rates: R_f_daily = R_f_annual / 252
        rf_daily_arr = np.array(risk_free_rates_annual) / TRADING_DAYS_PER_YEAR
        excess_returns = ret_arr - rf_daily_arr
        
        mean_excess = np.mean(excess_returns)
        std_ret = np.std(ret_arr, ddof=1)

        if std_ret <= 0:
            return 0.0

        sharpe = (mean_excess / std_ret) * math.sqrt(TRADING_DAYS_PER_YEAR)
        return round(float(sharpe), 4)

    elif frequency == "annualized":
        # Inputs are ALREADY annualized -> (R_annual - R_f_annual) / Std_annual (NO sqrt(252)!)
        mean_excess = np.mean(ret_arr) - np.mean(risk_free_rates_annual)
        std_ret = annualized_volatility if annualized_volatility is not None else (np.std(ret_arr, ddof=1) if len(ret_arr) > 1 else np.std(ret_arr))

        if std_ret is None or std_ret <= 0:
            return 0.0

        sharpe = mean_excess / std_ret
        return round(float(sharpe), 4)

    else:
        raise ValueError(f"Unsupported frequency: {frequency}")


def calculate_sortino_ratio(
    returns: List[float],
    risk_free_rates_annual: List[float],
    frequency: str = "daily"
) -> float:
    """Calculates Sortino Ratio using downside deviation of negative excess returns."""
    if not returns or len(returns) < 2:
        return 0.0

    ret_arr = np.array(returns)

    if frequency == "daily":
        rf_daily_arr = np.array(risk_free_rates_annual) / TRADING_DAYS_PER_YEAR
        excess_returns = ret_arr - rf_daily_arr
        
        mean_excess = np.mean(excess_returns)

        # Downside Deviation: only negative excess returns
        negative_excess = excess_returns[excess_returns < 0]
        if len(negative_excess) == 0:
            return 999.0 # Pure positive performance

        downside_std = math.sqrt(np.mean(negative_excess ** 2))
        if downside_std <= 0:
            return 0.0

        sortino = (mean_excess / downside_std) * math.sqrt(TRADING_DAYS_PER_YEAR)
        return round(float(sortino), 4)
    else:
        mean_excess = np.mean(ret_arr) - np.mean(risk_free_rates_annual)
        negative_excess = ret_arr[ret_arr < 0]
        if len(negative_excess) == 0:
            return 999.0

        downside_std = math.sqrt(np.mean(negative_excess ** 2))
        if downside_std <= 0:
            return 0.0

        sortino = mean_excess / downside_std
        return round(float(sortino), 4)


def calculate_max_drawdown(equity_series: List[float]) -> float:
    """Calculates peak-to-trough maximum drawdown percentage."""
    if not equity_series:
        return 0.0

    peak = equity_series[0]
    max_dd = 0.0

    for eq in equity_series:
        if eq > peak:
            peak = eq
        dd = (peak - eq) / peak if peak > 0 else 0.0
        if dd > max_dd:
            max_dd = dd

    return round(float(max_dd * 100), 4)


def generate_portfolio_performance_report(
    dates: List[str],
    equity_series: List[float],
    benchmark_equity_series: Optional[List[float]] = None,
    conn=None
) -> Dict[str, Any]:
    """Generates complete verified portfolio performance analytics report."""
    if len(equity_series) < 2:
        return {"status": "INSUFFICIENT_DATA"}

    daily_returns = calculate_daily_returns(equity_series)

    # Fetch time-versioned risk-free rates for return periods
    rf_rates = fetch_historical_risk_free_rates(dates[1:], conn=conn)
    rf_annual_list = [rf_rates[d] for d in dates[1:]]

    mean_daily_return = float(np.mean(daily_returns))
    annualized_return = ((1 + mean_daily_return) ** TRADING_DAYS_PER_YEAR) - 1.0
    daily_volatility = float(np.std(daily_returns, ddof=1))
    annualized_volatility = daily_volatility * math.sqrt(TRADING_DAYS_PER_YEAR)

    sharpe = calculate_sharpe_ratio(daily_returns, rf_annual_list, frequency="daily")
    sortino = calculate_sortino_ratio(daily_returns, rf_annual_list, frequency="daily")
    max_dd = calculate_max_drawdown(equity_series)

    report = {
        "dates_count": len(dates),
        "total_net_return_pct": round(((equity_series[-1] - equity_series[0]) / equity_series[0]) * 100, 4),
        "annualized_return_pct": round(annualized_return * 100, 4),
        "annualized_volatility_pct": round(annualized_volatility * 100, 4),
        "sharpe_ratio": sharpe,
        "sortino_ratio": sortino,
        "max_drawdown_pct": max_dd,
        "average_risk_free_rate_pct": round(float(np.mean(rf_annual_list)) * 100, 2)
    }

    if benchmark_equity_series and len(benchmark_equity_series) == len(equity_series):
        bench_returns = calculate_daily_returns(benchmark_equity_series)
        bench_net_return = round(((benchmark_equity_series[-1] - benchmark_equity_series[0]) / benchmark_equity_series[0]) * 100, 4)
        report["benchmark_egx30_total_return_pct"] = bench_net_return
        report["alpha_over_benchmark_pct"] = round(report["total_net_return_pct"] - bench_net_return, 4)

    return report
