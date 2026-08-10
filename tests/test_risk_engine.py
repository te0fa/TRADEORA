import pytest
import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.risk_engine import (
    fetch_active_risk_parameters,
    calculate_position_size,
    calculate_portfolio_heat,
    evaluate_trade_risk,
    CircuitBreakerHaltedError,
    ExcessivePortfolioHeatError,
    get_db_conn
)


def test_time_versioned_risk_parameters_fetch():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    try:
        params = fetch_active_risk_parameters("2026-08-11", conn=conn)

        assert params["MAX_RISK_PER_TRADE_PCT"] == 0.02
        assert params["MAX_PORTFOLIO_HEAT_PCT"] == 0.10
        assert params["MAX_CONCENTRATION_PCT"] == 0.15
        assert params["MAX_ADV_LIQUIDITY_PCT"] == 0.10
        assert params["MAX_DRAWDOWN_BREAKER_PCT"] == 0.20
    finally:
        conn.close()


def test_deterministic_position_sizing_hand_calculation():
    # NAV = 100,000 EGP, Entry = 50.0 EGP, SL = 45.0 EGP (Risk per share = 5.0 EGP)
    # Max Risk Per Trade = 2% of 100k = 2,000 EGP -> Raw Shares = 2000 / 5 = 400 shares.
    # Concentration Cap = 15% of 100k = 15,000 EGP -> Conc Shares = 15,000 / 50 = 300 shares.
    # ADV 20-day = 5,000 shares -> ADV Cap (10%) = 500 shares.
    # Final Shares = min(400, 300, 500) = 300 shares!

    sizing = calculate_position_size(
        nav=100000.0,
        entry_price=50.0,
        stop_loss=45.0,
        adv_20=5000.0,
        as_of_date="2026-08-11"
    )

    assert sizing["shares"] == 300
    assert sizing["capital_allocated"] == 15000.0 # 300 * 50.0
    assert sizing["raw_risk_shares"] == 400
    assert sizing["concentration_cap_shares"] == 300


def test_fail_closed_on_missing_price_or_stop_loss():
    # Missing entry price -> Must Fail Closed
    res_no_price = evaluate_trade_risk(
        trade_request={"entry_price": None, "sl": 45.0},
        open_trades=[],
        current_nav=100000.0,
        peak_nav=100000.0
    )
    assert res_no_price["status"] == "REJECTED"
    assert "FAIL_CLOSED" in res_no_price["reason"]

    # Missing stop loss -> Must Fail Closed
    res_no_sl = evaluate_trade_risk(
        trade_request={"entry_price": 50.0, "sl": None},
        open_trades=[],
        current_nav=100000.0,
        peak_nav=100000.0
    )
    assert res_no_sl["status"] == "REJECTED"
    assert "FAIL_CLOSED" in res_no_sl["reason"]


def test_portfolio_heat_rejection():
    # NAV = 100,000 EGP. Open Trade 1 Risk = 9,000 EGP (9% heat)
    open_trades = [{"shares": 1000, "entry_price": 50.0, "sl": 41.0}]

    # Attempt Trade 2 (Capped shares = 150, Risk = 150 * 10 = 1,500 EGP = 1.5% heat)
    # Total Heat = 9% + 1.5% = 10.5% > 10% limit -> MUST RAISE ExcessivePortfolioHeatError
    trade_request = {"entry_price": 100.0, "sl": 90.0}

    with pytest.raises(ExcessivePortfolioHeatError):
        evaluate_trade_risk(
            trade_request=trade_request,
            open_trades=open_trades,
            current_nav=100000.0,
            peak_nav=100000.0,
            adv_20=100000.0,
            as_of_date="2026-08-11"
        )


def test_drawdown_circuit_breaker_emergency_halt():
    # Peak NAV = 100,000 EGP, Current NAV = 79,000 EGP (Drawdown = 21% >= 20% limit) -> MUST RAISE CircuitBreakerHaltedError
    trade_request = {"entry_price": 50.0, "sl": 45.0}

    with pytest.raises(CircuitBreakerHaltedError):
        evaluate_trade_risk(
            trade_request=trade_request,
            open_trades=[],
            current_nav=79000.0,
            peak_nav=100000.0,
            adv_20=50000.0,
            as_of_date="2026-08-11"
        )


def test_valid_trade_request_approval():
    trade_request = {"entry_price": 50.0, "sl": 45.0}

    res = evaluate_trade_risk(
        trade_request=trade_request,
        open_trades=[],
        current_nav=100000.0,
        peak_nav=100000.0,
        adv_20=50000.0,
        as_of_date="2026-08-11"
    )

    assert res["status"] == "APPROVED"
    assert res["sizing"]["shares"] == 300
    assert res["portfolio_heat_after"] == 1.5 # (300 * 5) / 100,000 = 1.5%
