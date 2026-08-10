import pytest
import os
import uuid
import psycopg2
import psycopg2.extras
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

from services.observability import (
    record_pipeline_run,
    observe_pipeline,
    get_db_connection
)

DATABASE_URL = os.getenv('DATABASE_URL')


def test_successful_pipeline_heartbeat():
    test_pipeline = f"test_pipeline_{uuid.uuid4().hex[:6]}"
    test_run_id = f"run_{uuid.uuid4().hex[:8]}"
    start_time = datetime.now(timezone.utc)

    # Execute observed function
    @observe_pipeline(pipeline_id=test_pipeline, run_id=test_run_id)
    def dummy_task():
        return {"rows_processed": 150}

    res = dummy_task()
    assert res["rows_processed"] == 150

    # Verify DB record
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("SELECT * FROM public.pipeline_health WHERE pipeline_id = %s AND run_id = %s;", (test_pipeline, test_run_id))
                row = cur.fetchone()
                assert row is not None
                assert row["status"] == "SUCCESS"
                assert row["rows_processed"] == 150
                assert row["duration_ms"] >= 0
                assert row["error_code"] is None
        finally:
            conn.close()


def test_staging_simulated_failure_recording():
    test_pipeline = f"failing_pipeline_{uuid.uuid4().hex[:6]}"
    test_run_id = f"run_{uuid.uuid4().hex[:8]}"

    # Execute failing function
    with pytest.raises(ValueError, match="Simulated provider timeout"):
        with observe_pipeline(pipeline_id=test_pipeline, run_id=test_run_id):
            raise ValueError("Simulated provider timeout")

    # Verify DB record captured the failure and error fields
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("SELECT * FROM public.pipeline_health WHERE pipeline_id = %s AND run_id = %s;", (test_pipeline, test_run_id))
                row = cur.fetchone()
                assert row is not None
                assert row["status"] == "FAILED"
                assert row["error_code"] == "ValueError"
                assert "Simulated provider timeout" in row["error_message"]
        finally:
            conn.close()


def test_idempotency_duplicate_run_prevention():
    test_pipeline = f"idempotent_pipe_{uuid.uuid4().hex[:6]}"
    test_run_id = f"run_{uuid.uuid4().hex[:8]}"
    start_time = datetime.now(timezone.utc)

    # First record
    record_pipeline_run(
        pipeline_id=test_pipeline,
        run_id=test_run_id,
        status="RUNNING",
        started_at=start_time,
        rows_processed=10
    )

    # Second record with final status (retry / update)
    record_pipeline_run(
        pipeline_id=test_pipeline,
        run_id=test_run_id,
        status="SUCCESS",
        started_at=start_time,
        finished_at=datetime.now(timezone.utc),
        rows_processed=50
    )

    # Verify strictly 1 row exists with updated status
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM public.pipeline_health WHERE pipeline_id = %s AND run_id = %s;", (test_pipeline, test_run_id))
                count = cur.fetchone()[0]
                assert count == 1

                cur.execute("SELECT status, rows_processed FROM public.pipeline_health WHERE pipeline_id = %s AND run_id = %s;", (test_pipeline, test_run_id))
                row = cur.fetchone()
                assert row[0] == "SUCCESS"
                assert row[1] == 50
        finally:
            conn.close()


def test_structured_log_file_written():
    log_file = Path(__file__).parent.parent / "logs" / "pipeline_health.log"
    assert log_file.exists()
    content = log_file.read_text(encoding="utf-8")
    assert "Heartbeat | Pipeline:" in content
