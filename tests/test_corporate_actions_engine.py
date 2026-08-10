import pytest
from services.corporate_actions import (
    adjust_position,
    adjust_trade_price_targets,
    adjust_historical_series
)

def test_split_2_to_1_position_value_invariance():
    # 100 shares @ 50 EGP = 5000 EGP
    res = adjust_position(quantity=100.0, cost_basis=50.0, action_type="SPLIT", ratio=2.0)

    assert res["new_quantity"] == 200.0
    assert res["new_cost_basis"] == 25.0
    assert res["cash_flow_impact"] == 0.0
    assert res["total_book_value"] == 5000.0  # Exactly invariant!


def test_reverse_split_1_to_2_position_value_invariance():
    # 100 shares @ 50 EGP = 5000 EGP
    res = adjust_position(quantity=100.0, cost_basis=50.0, action_type="REVERSE_SPLIT", ratio=0.5)

    assert res["new_quantity"] == 50.0
    assert res["new_cost_basis"] == 100.0
    assert res["cash_flow_impact"] == 0.0
    assert res["total_book_value"] == 5000.0  # Exactly invariant!


def test_bonus_shares_10_percent_dilution():
    # 100 shares @ 50 EGP = 5000 EGP, 10% bonus (0.10)
    res = adjust_position(quantity=100.0, cost_basis=50.0, action_type="BONUS_SHARES", ratio=0.10)

    assert res["new_quantity"] == 110.0
    assert res["new_cost_basis"] == pytest.approx(45.4545, abs=0.001)
    assert res["cash_flow_impact"] == 0.0
    assert res["total_book_value"] == 5000.0  # Exactly invariant!


def test_rights_issue_subscription_exercise():
    # 100 shares @ 50 EGP = 5000 EGP. 20% rights issue @ 30 EGP sub price
    res = adjust_position(
        quantity=100.0,
        cost_basis=50.0,
        action_type="RIGHTS_ISSUE",
        ratio=0.20,
        subscription_price=30.0
    )

    # Rights qty = 20. Cash outflow = 20 * 30 = 600 EGP.
    # Total shares = 120. Total cost = 5600 EGP. Cost basis = 5600 / 120 = 46.6667 EGP.
    assert res["new_quantity"] == 120.0
    assert res["cash_flow_impact"] == 600.0
    assert res["new_cost_basis"] == pytest.approx(46.6667, abs=0.001)
    assert res["total_book_value"] == 5600.0


def test_active_trade_price_targets_adjustment_preserves_pnl_pct():
    # Trade: Entry=100, TP1=110 (+10%), TP2=120 (+20%), SL=90 (-10%)
    res = adjust_trade_price_targets(
        entry_price=100.0,
        tp1=110.0,
        tp2=120.0,
        sl=90.0,
        action_type="SPLIT",
        ratio=2.0
    )

    assert res["entry_price"] == 50.0
    assert res["tp1"] == 55.0
    assert res["tp2"] == 60.0
    assert res["sl"] == 45.0

    # Verify PnL percentages are preserved 100%
    pnl_tp1 = ((res["tp1"] - res["entry_price"]) / res["entry_price"]) * 100
    pnl_tp2 = ((res["tp2"] - res["entry_price"]) / res["entry_price"]) * 100
    pnl_sl  = ((res["sl"]  - res["entry_price"]) / res["entry_price"]) * 100

    assert pnl_tp1 == pytest.approx(10.0, abs=0.01)
    assert pnl_tp2 == pytest.approx(20.0, abs=0.01)
    assert pnl_sl  == pytest.approx(-10.0, abs=0.01)


def test_historical_closes_backward_adjustment():
    closes = [100.0, 102.0, 104.0, 52.0, 53.0]
    dates = ["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04", "2026-06-05"]
    ex_date = "2026-06-04"

    adj_closes = adjust_historical_series(closes, dates, ex_date, action_type="SPLIT", ratio=2.0)

    # Closes before 2026-06-04 should be halved (100 -> 50, 102 -> 51, 104 -> 52)
    assert adj_closes == [50.0, 51.0, 52.0, 52.0, 53.0]
