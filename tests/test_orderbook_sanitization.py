import pytest
import json
import re
from pathlib import Path

# Mock OrderBook resolution logic matching tradeora-web/app/api/orderbook/route.ts
def resolve_orderbook(snapshot):
    bids = []
    asks = []
    
    if snapshot:
        try:
            raw_bids = json.loads(snapshot["top_bids_json"]) if isinstance(snapshot.get("top_bids_json"), str) else snapshot.get("top_bids_json", [])
            if isinstance(raw_bids, list):
                bids = [
                    {
                        "price": float(b.get("price", 0)),
                        "volume": float(b.get("volume", b.get("qty", 0))),
                        "orders_count": int(b.get("orders_count", b.get("orders", 1)))
                    }
                    for b in raw_bids
                    if float(b.get("price", 0)) > 0 and float(b.get("volume", b.get("qty", 0))) > 0
                ]
        except Exception:
            bids = []

        try:
            raw_asks = json.loads(snapshot["top_asks_json"]) if isinstance(snapshot.get("top_asks_json"), str) else snapshot.get("top_asks_json", [])
            if isinstance(raw_asks, list):
                asks = [
                    {
                        "price": float(a.get("price", 0)),
                        "volume": float(a.get("volume", a.get("qty", 0))),
                        "orders_count": int(a.get("orders_count", a.get("orders", 1)))
                    }
                    for a in raw_asks
                    if float(a.get("price", 0)) > 0 and float(a.get("volume", a.get("qty", 0))) > 0
                ]
        except Exception:
            asks = []

    has_data = len(bids) > 0 or len(asks) > 0
    
    if not has_data:
        return {
            "success": True,
            "data_status": "UNAVAILABLE",
            "available": False,
            "is_derived": False,
            "message": "عمق السوق (Level 2) غير متاح لبورصة مصر حالياً لهذه الورقة المالية",
            "orderbook": {
                "data_status": "UNAVAILABLE",
                "available": False,
                "is_derived": False,
                "total_bid_qty": 0,
                "total_ask_qty": 0,
                "ofi_ratio": None,
                "imbalance_signal": "none",
                "bids": [],
                "asks": [],
                "snapshot_at": None
            }
        }
        
    is_derived = bool(snapshot.get("is_derived") or snapshot.get("source") in ["calculated", "tick_derived"])
    data_status = "DERIVED" if is_derived else "REAL"
    
    total_bid = sum(b["volume"] for b in bids)
    total_ask = sum(a["volume"] for a in asks)
    ofi = round(total_bid / max(1.0, total_ask), 2)
    
    return {
        "success": True,
        "data_status": data_status,
        "available": True,
        "is_derived": is_derived,
        "confidence": 0.85 if is_derived else 1.0,
        "orderbook": {
            "data_status": data_status,
            "available": True,
            "is_derived": is_derived,
            "total_bid_qty": total_bid,
            "total_ask_qty": total_ask,
            "ofi_ratio": ofi,
            "bids": bids,
            "asks": asks,
            "snapshot_at": snapshot.get("snapshot_at")
        }
    }


def test_orderbook_when_no_snapshot():
    res = resolve_orderbook(None)
    assert res["data_status"] == "UNAVAILABLE"
    assert res["available"] is False
    assert res["orderbook"]["bids"] == []
    assert res["orderbook"]["asks"] == []
    assert res["orderbook"]["total_bid_qty"] == 0
    assert res["orderbook"]["total_ask_qty"] == 0
    assert res["orderbook"]["ofi_ratio"] is None


def test_orderbook_when_valid_real_snapshot():
    sample_snapshot = {
        "snapshot_at": "2026-08-10T11:30:00Z",
        "is_derived": False,
        "source": "exchange_snapshot",
        "top_bids_json": [
            {"price": 140.5, "volume": 12500, "orders_count": 5},
            {"price": 140.0, "volume": 35000, "orders_count": 12}
        ],
        "top_asks_json": [
            {"price": 141.0, "volume": 8000, "orders_count": 3},
            {"price": 141.5, "volume": 22000, "orders_count": 9}
        ]
    }
    res = resolve_orderbook(sample_snapshot)
    assert res["data_status"] == "REAL"
    assert res["available"] is True
    assert res["is_derived"] is False
    assert len(res["orderbook"]["bids"]) == 2
    assert len(res["orderbook"]["asks"]) == 2
    assert res["orderbook"]["total_bid_qty"] == 47500
    assert res["orderbook"]["total_ask_qty"] == 30000
    assert res["orderbook"]["ofi_ratio"] == 1.58


def test_orderbook_when_derived_snapshot():
    sample_snapshot = {
        "snapshot_at": "2026-08-10T11:30:00Z",
        "is_derived": True,
        "source": "calculated",
        "top_bids_json": [{"price": 95.0, "volume": 5000, "orders_count": 2}],
        "top_asks_json": [{"price": 95.5, "volume": 6000, "orders_count": 3}]
    }
    res = resolve_orderbook(sample_snapshot)
    assert res["data_status"] == "DERIVED"
    assert res["available"] is True
    assert res["is_derived"] is True
    assert res["confidence"] == 0.85


def test_orderbook_when_malformed_snapshot():
    malformed_snapshot = {
        "snapshot_at": "2026-08-10T11:30:00Z",
        "top_bids_json": "{not_valid_json",
        "top_asks_json": None
    }
    res = resolve_orderbook(malformed_snapshot)
    assert res["data_status"] == "UNAVAILABLE"
    assert res["available"] is False
    assert res["orderbook"]["bids"] == []
    assert res["orderbook"]["asks"] == []


def test_regression_no_hardcoded_orderbook_numbers_in_source():
    repo_root = Path(r"E:\zaora\TRADEORA\tradeora-web")
    api_file = repo_root / "app" / "api" / "orderbook" / "route.ts"
    
    content = api_file.read_text(encoding="utf-8")
    
    # Check that fabricated numbers are absent
    forbidden_numbers = ["145000", "290000", "85000", "62000", "41000", "55000", "72000", "98000", "110000", "135000"]
    for num in forbidden_numbers:
        assert num not in content, f"Forbidden fabricated mock volume number '{num}' found in {api_file}"
    
    # Check that explicit UNAVAILABLE is returned
    assert "UNAVAILABLE" in content
    assert "data_status" in content
