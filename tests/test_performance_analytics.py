import pytest
import math
import numpy as np
import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.performance_analytics import (
    calculate_daily_returns,
    calculate_sharpe_ratio,
    calculate_sortino_ratio,
    calculate_max_drawdown,
    fetch_historical_risk_free_rates,
    generate_portfolio_performance_report,
    get_db_conn
)


def test_hand_calculated_performance_metrics_reconciliation():
    # Small test dataset: Equity curve over 5 days
    # Day 0: 100,000 EGP
    # Day 1: 102,000 EGP (+2.0%)
    # Day 2: 101,000 EGP (-0.9804%)
    # Day 3: 104,000 EGP (+2.9703%)
    # Day 4: 103,000 EGP (-0.9615%)

    equity_series = [100000.0, 102000.0, 101000.0, 104000.0, 103000.0]
    dates = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05"]

    returns = calculate_daily_returns(equity_series)
    assert len(returns) == 4
    assert round(returns[0], 4) == 0.0200
    assert round(returns[1], 4) == -0.0098

    # Hand Calculate Max Drawdown:
    # Peak 1 = 102,000 EGP on Day 1. Trough 1 = 101,000 EGP on Day 2 -> DD1 = (102k - 101k)/102k = 0.9804%
    # Peak 2 = 104,000 EGP on Day 3. Trough 2 = 103,000 EGP on Day 4 -> DD2 = (104k - 103k)/104k = 0.9615%
    # Max DD = max(0.9804%, 0.9615%) = 0.9804%
    max_dd = calculate_max_drawdown(equity_series)
    assert max_dd == 0.9804


def test_sharpe_ratio_no_double_annualization_bug():
    # Test case with ALREADY ANNUALIZED inputs
    # Annualized Return = 30.0% (0.30)
    # Annualized Risk-Free = 20.0% (0.20)
    # Annualized Volatility = 10.0% (0.10)
    # Correct Sharpe = (0.30 - 0.20) / 0.10 = 1.0000
    # BUGGY Sharpe (if double multiplied by sqrt(252)) = 1.0 * 15.8745 = 15.8745 (WRONG!)

    sharpe_annual = calculate_sharpe_ratio(
        returns=[0.30],
        risk_free_rates_annual=[0.20],
        frequency="annualized",
        annualized_volatility=0.10
    )

    assert sharpe_annual == 1.0000 # Strictly 1.0000! Zero double multiplication!


def test_time_versioned_risk_free_rate_fetch():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    try:
        dates = ["2026-01-15", "2026-06-15", "2026-08-05"]
        rates = fetch_historical_risk_free_rates(dates, conn=conn)

        assert rates["2026-01-15"] == 0.2250 # 22.50%
        assert rates["2026-06-15"] == 0.2350 # 23.50%
        assert rates["2026-08-05"] == 0.2400 # 24.00%
    finally:
        conn.close()


def test_generate_full_performance_report_with_benchmark():
    equity_series = [100000.0, 102000.0, 105000.0, 108000.0]
    bench_series = [1000.0, 1010.0, 1020.0, 1030.0]
    dates = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04"]

    report = generate_portfolio_performance_report(
        dates=dates,
        equity_series=equity_series,
        benchmark_equity_series=bench_series
    )

    assert report["total_net_return_pct"] == 8.0 # (108k - 100k)/100k
    assert report["benchmark_egx30_total_return_pct"] == 3.0 # (1030 - 1000)/1000
    assert report["alpha_over_benchmark_pct"] == 5.0 # 8% - 3% = +5.0% Alpha!
    assert report["max_drawdown_pct"] == 0.0 # Monotonically increasing equity curve
