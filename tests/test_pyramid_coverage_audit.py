import pytest
import os
import json
from pathlib import Path

AUDIT_REPORT_PATH = Path(__file__).parent.parent / "models" / "test_suite_audit_report.json"


def test_testing_pyramid_audit_report_integrity():
    assert AUDIT_REPORT_PATH.exists(), f"Missing audit report at {AUDIT_REPORT_PATH}"

    with open(AUDIT_REPORT_PATH, "r", encoding="utf-8") as f:
        report = json.load(f)

    assert report["project"] == "TRADEORA EGX"
    assert report["pass_rate_percentage"] == 100.0
    assert report["total_tests_passed"] >= 131

    pyramid = report["pyramid_classification"]

    # Verify P0 Priorities exist and are 100% passed
    assert "1_FINANCIAL_LEDGER_AND_PRECISION" in pyramid
    assert "2_DATA_INTEGRITY_AND_GOVERNANCE" in pyramid
    assert "3_SECURITY_AND_AUTHORIZATION" in pyramid
    assert "4_RISK_AND_POSITION_SIZING" in pyramid

    for tier, data in pyramid.items():
        assert data["status"] == "PASSED_100_PERCENT"
        assert len(data["test_files"]) > 0
