import pytest
from datetime import date, datetime, timedelta, timezone
from services.quality_gate import (
    validate_single_record,
    validate_batch
)

def test_valid_standard_candle():
    record = {
        "symbol": "COMI",
        "company_id": "comi_uuid",
        "price_date": datetime.now(timezone.utc).date().isoformat(),
        "open_price": 50.0,
        "high_price": 52.5,
        "low_price": 49.5,
        "close_price": 51.0,
        "volume": 1250000,
        "source": "tradingview_1d"
    }

    res = validate_single_record(record, previous_close=50.5)
    assert res["status"] == "VALID"
    assert res["is_pass"] is True
    assert res["rejection_reason"] is None


def test_high_less_than_low_geometry_violation():
    record = {
        "symbol": "HRHO",
        "company_id": "hrho_uuid",
        "price_date": datetime.now(timezone.utc).date().isoformat(),
        "open_price": 20.0,
        "high_price": 18.0,  # INVALID: High < Low
        "low_price": 22.0,
        "close_price": 19.5,
        "volume": 500000,
        "source": "tradingview_1d"
    }

    res = validate_single_record(record)
    assert res["status"] == "INVALID"
    assert res["is_pass"] is False
    assert "High (18.0) < Low (22.0)" in res["rejection_reason"]


def test_negative_volume_injection():
    record = {
        "symbol": "EKHO",
        "company_id": "ekho_uuid",
        "price_date": datetime.now(timezone.utc).date().isoformat(),
        "open_price": 1.20,
        "high_price": 1.25,
        "low_price": 1.18,
        "close_price": 1.22,
        "volume": -5000,  # INVALID: Negative Volume
        "source": "tradingview_1d"
    }

    res = validate_single_record(record)
    assert res["status"] == "INVALID"
    assert res["is_pass"] is False
    assert "Negative trading volume" in res["rejection_reason"]


def test_future_timestamp_rejection():
    future_date = (datetime.now(timezone.utc).date() + timedelta(days=10)).isoformat()
    record = {
        "symbol": "FWRY",
        "company_id": "fwry_uuid",
        "price_date": future_date,  # INVALID: Future timestamp
        "close_price": 6.50,
        "source": "tradingview_1d"
    }

    res = validate_single_record(record)
    assert res["status"] == "INVALID"
    assert res["is_pass"] is False
    assert "Future price date" in res["rejection_reason"]


def test_forbidden_vendor_source_rejection():
    record = {
        "symbol": "TMGH",
        "company_id": "tmgh_uuid",
        "price_date": datetime.now(timezone.utc).date().isoformat(),
        "close_price": 45.0,
        "source": "mubasher_close_only"  # INVALID: Forbidden source
    }

    res = validate_single_record(record)
    assert res["status"] == "INVALID"
    assert res["is_pass"] is False
    assert "Forbidden data source" in res["rejection_reason"]


def test_stale_price_record():
    stale_date = (datetime.now(timezone.utc).date() - timedelta(days=25)).isoformat()
    record = {
        "symbol": "SWDY",
        "company_id": "swdy_uuid",
        "price_date": stale_date,
        "close_price": 32.0,
        "source": "egx_bulletin"
    }

    res = validate_single_record(record)
    assert res["status"] == "STALE"
    assert res["is_pass"] is True


def test_legitimate_corporate_action_split_not_rejected():
    # Stock split 1:5 -> Price drops from 100 to 20 (-80% change)
    split_date = datetime.now(timezone.utc).date().isoformat()
    record = {
        "symbol": "ESRS",
        "company_id": "esrs_uuid",
        "price_date": split_date,
        "open_price": 20.0,
        "high_price": 21.0,
        "low_price": 19.5,
        "close_price": 20.0,
        "volume": 2000000,
        "source": "egx_bulletin"
    }

    corporate_actions = [
        {"symbol": "ESRS", "event_date": split_date, "event_type": "SPLIT", "ratio": 0.2}
    ]

    res = validate_single_record(record, previous_close=100.0, known_corporate_actions=corporate_actions)
    # MUST NOT BE INVALID! Must be classified as CORPORATE_ACTION_RELATED
    assert res["status"] == "CORPORATE_ACTION_RELATED"
    assert res["is_pass"] is True
    assert res["rejection_reason"] is None


def test_unverified_large_drift_enters_suspicious_quarantine():
    # 70% flash crash without corporate action registration -> enters SUSPICIOUS quarantine
    record = {
        "symbol": "UNKNOWN_STOCK",
        "company_id": "unk_uuid",
        "price_date": datetime.now(timezone.utc).date().isoformat(),
        "close_price": 30.0,
        "source": "tradingview_1d"
    }

    res = validate_single_record(record, previous_close=100.0, known_corporate_actions=[])
    assert res["status"] == "SUSPICIOUS"
    assert res["is_pass"] is False
    assert "without confirmed corporate action" in res["rejection_reason"]
