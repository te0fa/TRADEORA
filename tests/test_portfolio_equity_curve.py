import pytest
import os
import uuid
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.portfolio_equity_curve import (
    calculate_daily_portfolio_snapshot,
    record_daily_equity_snapshot,
    get_db_conn
)
from services.corporate_actions import adjust_position


def test_concurrent_open_positions_equity_curve():
    # Initial Cash: 50,000 EGP
    # Position 1: COMI 1,000 shares @ 50 EGP (Cost 50k, Curr Price 55 EGP -> Mkt Val 55k)
    # Position 2: EAST 2,000 shares @ 20 EGP (Cost 40k, Curr Price 22 EGP -> Mkt Val 44k)
    # Total Equity = 50,000 Cash + 55,000 + 44,000 = 149,000 EGP

    open_positions = [
        {"symbol": "COMI", "shares": 1000, "cost_basis": 50.0},
        {"symbol": "EAST", "shares": 2000, "cost_basis": 20.0}
    ]
    current_prices = {"COMI": 55.0, "EAST": 22.0}

    snapshot = calculate_daily_portfolio_snapshot(
        cash_balance=50000.0,
        open_positions=open_positions,
        current_prices=current_prices,
        historical_peak_equity=150000.0
    )

    assert snapshot["active_positions_count"] == 2
    assert snapshot["unrealized_market_value"] == 99000.0 # 55k + 44k
    assert snapshot["total_equity"] == 149000.0           # 50k + 99k
    assert snapshot["peak_equity"] == 150000.0
    assert snapshot["drawdown_pct"] == round(((150000 - 149000) / 150000) * 100, 4) # 0.6667%


def test_cash_dividends_flow_into_total_return():
    snapshot = calculate_daily_portfolio_snapshot(
        cash_balance=50000.0,
        open_positions=[],
        current_prices={},
        cumulative_dividends=2500.0, # Net dividends received
        historical_peak_equity=50000.0
    )

    assert snapshot["total_equity"] == 52500.0 # 50,000 Cash + 2,500 Dividends
    assert snapshot["cumulative_dividends"] == 2500.0


def test_corporate_action_split_equity_invariance():
    # Before Split: 1,000 shares @ 50 EGP (Mkt Val = 50,000 EGP)
    pos_before = {"symbol": "COMI", "shares": 1000, "cost_basis": 50.0}
    price_before = {"COMI": 50.0}

    snap_before = calculate_daily_portfolio_snapshot(10000.0, [pos_before], price_before)

    # Execute 2:1 Split via corporate actions engine
    adj = adjust_position(
        quantity=pos_before["shares"],
        cost_basis=pos_before["cost_basis"],
        action_type="SPLIT",
        ratio=2.0
    )
    pos_after = {"symbol": "COMI", "shares": adj["new_quantity"], "cost_basis": adj["new_cost_basis"]}
    price_after = {"COMI": 25.0} # Post-split market price

    snap_after = calculate_daily_portfolio_snapshot(10000.0, [pos_after], price_after)

    # 100% Equity Invariance Assertion
    assert snap_before["total_equity"] == snap_after["total_equity"] == 60000.0


def test_portfolio_equity_snapshot_db_persistence():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    account_id = f"TEST_ACC_{uuid.uuid4().hex[:4]}"
    test_date = "2026-08-10"

    try:
        snapshot_data = calculate_daily_portfolio_snapshot(
            cash_balance=100000.0,
            open_positions=[],
            current_prices={},
            historical_peak_equity=100000.0
        )

        row = record_daily_equity_snapshot(test_date, snapshot_data, account_id=account_id, conn=conn)

        assert row["account_id"] == account_id
        assert float(row["total_equity"]) == 100000.0
        assert str(row["snapshot_date"]) == test_date

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.portfolio_equity_snapshots WHERE account_id = %s;", (account_id,))
        conn.close()
