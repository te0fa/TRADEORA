import pytest
from pathlib import Path

# Simulation of 4-tier taxonomy segregation logic from tradeora-web/app/api/trades/route.ts
def classify_trades_and_aggregate(raw_trades):
    # Tier 1: PRODUCTION
    prod_trades = [t for t in raw_trades if t.get("classification") == "PRODUCTION"]
    prod_closed = [t for t in prod_trades if t.get("status") == "closed"]
    prod_wins = [t for t in prod_closed if float(t.get("pnl_percent") or 0) > 0]
    prod_wr = round((len(prod_wins) / len(prod_closed)) * 100, 1) if len(prod_closed) >= 30 else None
    
    # Tier 2: CLEAN_OOS
    oos_trades = [t for t in raw_trades if t.get("classification") == "CLEAN_OOS"]
    oos_closed = [t for t in oos_trades if t.get("status") == "closed"]
    oos_wins = [t for t in oos_closed if float(t.get("pnl_percent") or 0) > 0]
    oos_wr = round((len(oos_wins) / len(oos_closed)) * 100, 1) if len(oos_closed) >= 30 else None
    
    # Tier 3: LEGACY_RESEARCH
    legacy_trades = [t for t in raw_trades if (t.get("classification") or "LEGACY_RESEARCH") == "LEGACY_RESEARCH"]
    legacy_closed = [t for t in legacy_trades if t.get("status") == "closed"]
    legacy_wins = [t for t in legacy_closed if float(t.get("pnl_percent") or 0) > 0]
    legacy_wr = round((len(legacy_wins) / len(legacy_closed)) * 100, 1) if len(legacy_closed) > 0 else 0
    
    # Tier 4: ALL_HISTORICAL
    all_trades = raw_trades
    
    return {
        "production": {
            "tier_id": "PRODUCTION",
            "is_certified": True,
            "total_trades": len(prod_trades),
            "closed_trades": len(prod_closed),
            "win_rate": prod_wr
        },
        "clean_oos": {
            "tier_id": "CLEAN_OOS",
            "is_certified": True,
            "total_trades": len(oos_trades),
            "closed_trades": len(oos_closed),
            "win_rate": oos_wr
        },
        "legacy_research": {
            "tier_id": "LEGACY_RESEARCH",
            "is_certified": False,
            "total_trades": len(legacy_trades),
            "closed_trades": len(legacy_closed),
            "win_rate": legacy_wr
        },
        "all_historical": {
            "tier_id": "ALL_HISTORICAL",
            "is_certified": False,
            "total_trades": len(all_trades)
        }
    }


def test_taxonomy_tiers_are_strictly_segregated():
    mock_trades = [
        {"id": "1", "classification": "PRODUCTION", "status": "closed", "pnl_percent": 5.0},
        {"id": "2", "classification": "CLEAN_OOS", "status": "closed", "pnl_percent": 3.5},
        {"id": "3", "classification": "LEGACY_RESEARCH", "status": "closed", "pnl_percent": -2.0},
        {"id": "4", "classification": "LEGACY_RESEARCH", "status": "closed", "pnl_percent": 4.0},
    ]
    result = classify_trades_and_aggregate(mock_trades)
    
    # Production must only contain PRODUCTION trades
    assert result["production"]["total_trades"] == 1
    assert result["production"]["is_certified"] is True
    
    # Clean OOS must only contain CLEAN_OOS trades
    assert result["clean_oos"]["total_trades"] == 1
    assert result["clean_oos"]["is_certified"] is True
    
    # Legacy Research must contain LEGACY_RESEARCH trades
    assert result["legacy_research"]["total_trades"] == 2
    assert result["legacy_research"]["is_certified"] is False
    
    # All Historical must contain all trades without deletion
    assert result["all_historical"]["total_trades"] == 4


def test_legacy_trades_do_not_contaminate_production_metrics():
    # 50 legacy trades with poor win rate, 35 production trades with high win rate
    legacy = [{"id": f"L{i}", "classification": "LEGACY_RESEARCH", "status": "closed", "pnl_percent": -1.0} for i in range(50)]
    production = [{"id": f"P{i}", "classification": "PRODUCTION", "status": "closed", "pnl_percent": 3.0} for i in range(35)]
    
    result = classify_trades_and_aggregate(legacy + production)
    
    # Production win rate is 100% (35/35), not contaminated by legacy losses
    assert result["production"]["win_rate"] == 100.0
    assert result["production"]["closed_trades"] == 35
    
    # Legacy win rate is 0% (0/50)
    assert result["legacy_research"]["win_rate"] == 0.0
    assert result["legacy_research"]["closed_trades"] == 50


def test_regression_no_date_hiding_filter_in_trades_route():
    trades_file = Path(r"E:\zaora\TRADEORA\tradeora-web\app\api\trades\route.ts")
    content = trades_file.read_text(encoding="utf-8")
    
    # Check that forbidden hiding filters are absent
    forbidden_snippets = [
        "const LAUNCH_DATE = '2026-08-03",
        "gte('recommended_at', LAUNCH_DATE)",
        "pre_launch_reset"
    ]
    for snippet in forbidden_snippets:
        assert snippet not in content, f"Date hiding snippet '{snippet}' found in {trades_file}"
        
    # Check that taxonomy structure is present
    assert "taxonomy:" in content
    assert "production:" in content
    assert "clean_oos:" in content
    assert "legacy_research:" in content
    assert "all_historical:" in content
