import pytest
import os
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.model_health_monitor import (
    evaluate_model_health,
    calculate_population_stability_index,
    ModelHaltedRedAlertError,
    MINIMUM_SAMPLE_SIZE,
    get_db_conn
)


def test_insufficient_sample_size_guard():
    # Less than 30 live trades returns INSUFFICIENT_SAMPLE
    trades = [{"pnl_pct": 0.02} for _ in range(15)]
    res = evaluate_model_health(
        live_trades=trades,
        live_prediction_probas=[0.65] * 15,
        reference_oos_probas=[0.65] * 100
    )
    assert res["status"] == "INSUFFICIENT_SAMPLE"
    assert res["sample_size"] == 15
    assert res["human_review_required"] is False


def test_normal_oos_aligned_telemetry_green_status():
    # 35 trades matching OOS expectancy ~ 2.5%
    trades = [{"pnl_pct": 0.025} for _ in range(35)]
    res = evaluate_model_health(
        live_trades=trades,
        live_prediction_probas=[0.60] * 35,
        reference_oos_probas=[0.60] * 100
    )
    assert res["status"] == "GREEN"
    assert res["human_review_required"] is False
    assert res["live_expectancy"] == 0.025


def test_moderate_drift_yellow_status_alert_no_halt():
    # 35 trades with slight drift (expectancy 1.2% vs lower CI 1.5%) -> YELLOW
    trades = [{"pnl_pct": 0.012} for _ in range(35)]
    res = evaluate_model_health(
        live_trades=trades,
        live_prediction_probas=[0.60] * 35,
        reference_oos_probas=[0.60] * 100
    )
    assert res["status"] == "YELLOW"
    assert res["human_review_required"] is True # Human review alert triggered
    assert "YELLOW" in res["reason"]
    # Does NOT raise ModelHaltedRedAlertError


def test_statistically_significant_degradation_red_status_automated_halt():
    # 35 trades with negative expectancy (-1.5%) -> RED -> AUTOMATED HALT
    trades = [{"pnl_pct": -0.015} for _ in range(35)]

    with pytest.raises(ModelHaltedRedAlertError) as exc_info:
        evaluate_model_health(
            live_trades=trades,
            live_prediction_probas=[0.40] * 35,
            reference_oos_probas=[0.70] * 100
        )

    assert "AUTOMATED_SYSTEM_HALT" in str(exc_info.value)
    assert "STATISTICAL_DEGRADATION_RED" in str(exc_info.value)


def test_model_health_telemetry_db_persistence():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    trades = [{"pnl_pct": 0.030} for _ in range(35)]
    res = evaluate_model_health(
        live_trades=trades,
        live_prediction_probas=[0.65] * 35,
        reference_oos_probas=[0.65] * 100
    )
    assert res["status"] == "GREEN"

    # Query DB to confirm persistent record
    conn = get_db_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT status, sample_size FROM public.model_health_telemetry ORDER BY evaluated_at DESC LIMIT 1;")
            row = cur.fetchone()
            assert row is not None
            assert row[0] == "GREEN"
            assert row[1] == 35
    finally:
        conn.close()
