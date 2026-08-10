import pytest
from services.signal_semantics import (
    classify_entry_signal,
    check_intraday_production_status,
    BUY_PROBABILITY_THRESHOLD,
    NEUTRAL_PROBABILITY_LOW
)


def test_low_buy_probability_maps_to_neutral_never_sell():
    # Low P(BUY) <= 0.35 must strictly produce NEUTRAL / HOLD, NOT fake SELL!
    res = classify_entry_signal(ml_probability=0.25, has_trained_short_model=False)

    assert res["signal"] == "NEUTRAL"
    assert res["action"] == "HOLD"
    assert "No directional Short model trained" in res["reason"]
    assert res["signal"] != "SELL"


def test_high_buy_probability_maps_to_buy():
    # P(BUY) >= 0.60 must produce BUY
    res = classify_entry_signal(ml_probability=0.68, has_trained_short_model=False)

    assert res["signal"] == "BUY"
    assert res["action"] == "ENTER_LONG"


def test_neutral_zone_probability_maps_to_hold():
    # P(BUY) = 0.45 (between 0.35 and 0.60) must produce NEUTRAL / HOLD
    res = classify_entry_signal(ml_probability=0.45, has_trained_short_model=False)

    assert res["signal"] == "NEUTRAL"
    assert res["action"] == "HOLD"


def test_null_probability_returns_neutral():
    res = classify_entry_signal(ml_probability=None, has_trained_short_model=False)

    assert res["signal"] == "NEUTRAL"
    assert res["action"] == "HOLD"


def test_intraday_production_path_is_disabled_with_documented_reason():
    gov = check_intraday_production_status()

    assert gov["status"] == "DISABLED"
    assert "LIVE_LOSS_REGRESSION" in gov["reason"]
    assert gov["historical_performance"]["net_pnl_pct"] == -5.25
    assert gov["historical_performance"]["sample_trades"] == 253
    assert len(gov["requirements_for_reactivation"]) >= 3
