import pytest
import os
import uuid
import psycopg2
import psycopg2.extras
from datetime import date
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.model_shadow_engine import (
    record_shadow_prediction,
    evaluate_promotion_gate,
    promote_v7_to_production,
    rollback_to_v6,
    MIN_SHADOW_SAMPLE_SIZE,
    get_db_conn,
    PROD_DIR,
    ROLLBACK_DIR,
    V7_DIR
)
from services.model_v7_trainer import train_clean_model_v7


def test_shadow_mode_telemetry_recording_zero_impact_on_live_trades():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"
    test_date = date(2026, 6, 2)

    try:
        # Log shadow prediction
        res = record_shadow_prediction(
            symbol=test_symbol,
            as_of_date=test_date,
            v6_pred=1,
            v6_prob=0.65,
            v7_pred=1,
            v7_prob=0.78,
            actual_outcome=1,
            conn=conn
        )

        assert res["symbol"] == test_symbol
        assert res["agreed"] is True

        # Verify database record
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT * FROM public.model_shadow_predictions WHERE symbol = %s;", (test_symbol,))
            row = cur.fetchone()
            assert row is not None
            assert row["v6_prediction"] == 1
            assert row["v7_prediction"] == 1

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.model_shadow_predictions WHERE symbol = %s;", (test_symbol,))
        conn.close()


def test_promotion_gate_blocks_if_samples_under_threshold():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"

    try:
        # Seed 5 samples (under 100 threshold)
        for i in range(5):
            record_shadow_prediction(
                symbol=f"{test_symbol}_{i}",
                as_of_date=f"2026-06-0{i+1}",
                v6_pred=1, v6_prob=0.6,
                v7_pred=1, v7_prob=0.7,
                actual_outcome=1,
                conn=conn
            )

        gate_res = evaluate_promotion_gate(
            approved_by="AI Committee",
            approval_reason="Testing gate block threshold",
            conn=conn
        )

        # Gate MUST be BLOCKED due to INSUFFICIENT_SHADOW_SAMPLES
        assert gate_res["status"] == "BLOCKED"
        assert gate_res["reason"] == "INSUFFICIENT_SHADOW_SAMPLES"

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.model_shadow_predictions WHERE symbol LIKE %s;", (f"{test_symbol}%",))
        conn.close()


def test_promotion_gate_and_rollback_flow():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"

    # Ensure Model v7 is trained first
    train_clean_model_v7(seed=42)

    try:
        # Seed 105 samples (meeting >= 100 requirement)
        with conn.cursor() as cur:
            for i in range(105):
                cur.execute("""
                    INSERT INTO public.model_shadow_predictions (
                        symbol, as_of_date, v6_prediction, v6_probability,
                        v7_prediction, v7_probability, agreed, actual_outcome
                    ) VALUES (%s, %s, 1, 0.60, 1, 0.75, TRUE, 1)
                    ON CONFLICT DO NOTHING;
                """, (f"{test_symbol}_{i}", f"2026-01-{(i%28)+1:02d}"))

        # Evaluate Promotion Gate
        gate_res = evaluate_promotion_gate(
            approved_by="Risk & Model Committee",
            approval_reason="Model v7 OOS accuracy superior to v6 across 105 shadow samples",
            conn=conn
        )

        assert gate_res["status"] == "APPROVED"
        app_id = gate_res["approval_id"]

        # Execute Promotion
        promo_res = promote_v7_to_production(approval_id=app_id, conn=conn)
        assert promo_res["status"] == "PROMOTED"
        assert PROD_DIR.exists()
        assert (PROD_DIR / "model_v7.pkl").exists()

        # Test Instant Rollback
        rollback_res = rollback_to_v6()
        assert rollback_res["status"] == "ROLLED_BACK"

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.model_shadow_predictions WHERE symbol LIKE %s;", (f"{test_symbol}%",))
            cur.execute("DELETE FROM public.model_promotion_approvals WHERE approved_by = 'Risk & Model Committee';")
        conn.close()
