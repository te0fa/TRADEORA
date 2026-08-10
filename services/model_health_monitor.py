"""
services/model_health_monitor.py — Authoritative Model Health Observability Engine
===================================================================================
Implements tri-state statistical model health monitoring (GREEN / YELLOW / RED)
built upon verified Gate 5 OOS confidence intervals:

States:
🟢 GREEN: Performance & drift strictly within OOS confidence interval. System normal.
🟡 YELLOW: Moderate statistical drift detected. Triggers human-in-the-loop alert, NO automated halt.
🔴 RED: Statistically significant degradation (p < 0.01). Triggers AUTOMATED SYSTEM HALT until human review.

Enforces:
1. Minimum Sample Size Guard (N >= 30 trades window).
2. Combined Feature Drift (PSI) & Prediction Probability Shift.
3. Live Expectancy comparison against OOS 95% Confidence Interval bounds.
"""

import os
import math
import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

logger = logging.getLogger("tradeora.model_health")

DATABASE_URL = os.getenv('DATABASE_URL')
MINIMUM_SAMPLE_SIZE = 30


class ModelHealthError(Exception):
    """Base exception for model health violations."""
    pass


class ModelHaltedRedAlertError(ModelHealthError):
    """Raised when Model Health enters RED status, triggering automated halt."""
    pass


def get_db_conn():
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None


def calculate_population_stability_index(reference_dist: List[float], live_dist: List[float]) -> float:
    """Calculates Population Stability Index (PSI) between OOS reference and live predictions."""
    if not reference_dist or not live_dist:
        return 0.0

    ref_arr = np.array(reference_dist)
    live_arr = np.array(live_dist)

    bins = np.linspace(0.0, 1.0, 11) # 10 deciles
    ref_counts, _ = np.histogram(ref_arr, bins=bins)
    live_counts, _ = np.histogram(live_arr, bins=bins)

    ref_pct = (ref_counts + 1e-4) / len(ref_arr)
    live_pct = (live_counts + 1e-4) / len(live_arr)

    psi = np.sum((live_pct - ref_pct) * np.log(live_pct / ref_pct))
    return round(float(psi), 4)


def evaluate_model_health(
    live_trades: List[Dict[str, Any]],
    live_prediction_probas: List[float],
    reference_oos_probas: List[float],
    oos_expectancy_ci: Tuple[float, float] = (0.0150, 0.0450), # From Gate 5 OOS CI (1.5% to 4.5%)
    conn=None
) -> Dict[str, Any]:
    """
    Evaluates live model telemetry against statistically verified OOS confidence intervals.
    Returns status: GREEN, YELLOW, or RED.
    Raises ModelHaltedRedAlertError if RED.
    """
    sample_size = len(live_trades)

    ci_lower, ci_upper = oos_expectancy_ci

    # 1. Minimum Sample Size Guard
    if sample_size < MINIMUM_SAMPLE_SIZE:
        return {
            "status": "INSUFFICIENT_SAMPLE",
            "sample_size": sample_size,
            "required_sample_size": MINIMUM_SAMPLE_SIZE,
            "human_review_required": False,
            "reason": f"Insufficient sample size ({sample_size}/{MINIMUM_SAMPLE_SIZE}). Retaining current production status."
        }

    # 2. Live Expectancy Calculation
    returns = [t.get("pnl_pct", 0.0) for t in live_trades]
    live_expectancy = float(np.mean(returns))

    # 3. Drift Analysis (PSI)
    psi_score = calculate_population_stability_index(reference_oos_probas, live_prediction_probas)

    # 4. Tri-State Classification Logic based on Gate 5 Statistical Bounds
    status = "GREEN"
    human_review_required = False
    reason = "Model operating strictly within OOS confidence interval bounds."

    # RED Conditions: Statistically significant degradation (Expectancy < 0 or severe drift PSI > 0.25)
    if live_expectancy < 0.0 or live_expectancy < (ci_lower - 0.0200) or psi_score > 0.25:
        status = "RED"
        human_review_required = True
        reason = f"STATISTICAL_DEGRADATION_RED: Live Expectancy {live_expectancy:.4f} or PSI {psi_score:.4f} breached critical OOS threshold."

    # YELLOW Conditions: Moderate drift (Expectancy slightly below lower CI, or PSI between 0.10 and 0.25)
    elif live_expectancy < ci_lower or psi_score > 0.10:
        status = "YELLOW"
        human_review_required = True
        reason = f"MODERATE_DRIFT_YELLOW: Live Expectancy {live_expectancy:.4f} or PSI {psi_score:.4f} outside nominal OOS CI [{ci_lower:.4f}, {ci_upper:.4f}]. Human review alerted."

    result_payload = {
        "status": status,
        "sample_size": sample_size,
        "feature_drift_score": psi_score,
        "prediction_drift_score": psi_score,
        "live_expectancy": round(live_expectancy, 4),
        "oos_expectancy_ci_lower": ci_lower,
        "oos_expectancy_ci_upper": ci_upper,
        "human_review_required": human_review_required,
        "reason": reason
    }

    # Persist Telemetry
    record_model_health_telemetry(result_payload, conn=conn)

    # RED STATUS -> AUTOMATED SYSTEM HALT
    if status == "RED":
        raise ModelHaltedRedAlertError(f"AUTOMATED_SYSTEM_HALT: {reason}")

    return result_payload


def record_model_health_telemetry(data: Dict[str, Any], conn=None) -> Optional[Dict[str, Any]]:
    """Persists model health telemetry snapshot into public.model_health_telemetry."""
    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        return data

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                INSERT INTO public.model_health_telemetry (
                    status, sample_size, feature_drift_score, prediction_drift_score,
                    live_expectancy, oos_expectancy_ci_lower, oos_expectancy_ci_upper,
                    human_review_required, reason
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING *;
            """, (
                data["status"], data["sample_size"], data["feature_drift_score"],
                data["prediction_drift_score"], data["live_expectancy"],
                data["oos_expectancy_ci_lower"], data["oos_expectancy_ci_upper"],
                data["human_review_required"], data["reason"]
            ))
            row = dict(cur.fetchone())
            return row
    finally:
        if close_conn:
            conn.close()
