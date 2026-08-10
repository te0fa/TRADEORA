import pytest
import time
import os
import json
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.performance_profiler import (
    profile_execution_time,
    measure_system_resource_utilization,
    measure_database_query_latency,
    generate_performance_baseline_report,
    get_db_conn
)

REPORT_PATH = Path(__file__).parent.parent / "models" / "performance_baseline_report.json"


def test_profile_execution_time_measurement():
    def dummy_task():
        time.sleep(0.02) # Sleep 20ms
        return 42

    elapsed_ms, result = profile_execution_time(dummy_task)
    assert result == 42
    assert elapsed_ms >= 15.0 # At least 15ms measured


def test_measure_system_resource_utilization():
    metrics = measure_system_resource_utilization()
    assert "memory_rss_mb" in metrics
    assert metrics["memory_rss_mb"] > 0.0
    assert "cpu_percent" in metrics


def test_measure_database_query_latency():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    try:
        latency_info = measure_database_query_latency(conn=conn)
        assert latency_info["sample_count"] == 10
        assert latency_info["p50_latency_ms"] < 150.0 # P50 network latency threshold < 150ms
    finally:
        conn.close()


def test_performance_baseline_report_telemetry_integrity():
    assert REPORT_PATH.exists(), f"Missing report file at {REPORT_PATH}"

    with open(REPORT_PATH, "r", encoding="utf-8") as f:
        report = json.load(f)

    assert report["project"] == "TRADEORA EGX"
    assert "system_resources" in report
    assert "database_metrics" in report
    assert "prioritized_bottlenecks" in report

    bottlenecks = report["prioritized_bottlenecks"]
    assert len(bottlenecks) >= 2
    assert bottlenecks[0]["rank"] == 1
    assert bottlenecks[1]["rank"] == 2
