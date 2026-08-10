import pytest
from pathlib import Path

# Replication of technical badge extraction logic from tradeora-web/app/api/trades/route.ts
def extract_trade_badges(trade):
    snap = trade.get("features_snapshot") or {}
    
    is_wyckoff_spring = bool(snap.get("is_wyckoff_spring"))
    wyckoff_badge_ar = snap.get("wyckoff_badge_ar") if is_wyckoff_spring else None
    
    price_channel = snap.get("price_channel")
    channel_badge_ar = snap.get("channel_badge_ar") or (price_channel.get("badge_ar") if price_channel else None)
    
    pattern_badge_ar = snap.get("pattern_badge_ar") or None
    fundamental_badge_ar = snap.get("fundamental_badge_ar") or None
    fundamental_score = float(snap["fundamental_score"]) if snap.get("fundamental_score") is not None else None
    fundamental_tier = snap.get("fundamental_tier") or None
    
    smart_money_badge_ar = snap.get("smart_money_badge_ar") or None
    smart_money_score = float(snap["smart_money_score"]) if snap.get("smart_money_score") is not None else None
    
    ict_smc_badge_ar = snap.get("ict_smc_badge_ar") or None
    elliott_badge_ar = snap.get("elliott_badge_ar") or None
    
    return {
        "is_wyckoff_spring": is_wyckoff_spring,
        "wyckoff_badge_ar": wyckoff_badge_ar,
        "pattern_badge_ar": pattern_badge_ar,
        "channel_badge_ar": channel_badge_ar,
        "fundamental_badge_ar": fundamental_badge_ar,
        "fundamental_score": fundamental_score,
        "fundamental_tier": fundamental_tier,
        "smart_money_badge_ar": smart_money_badge_ar,
        "smart_money_score": smart_money_score,
        "ict_smc_badge_ar": ict_smc_badge_ar,
        "elliott_badge_ar": elliott_badge_ar,
    }


def test_badges_when_no_snapshot():
    trade = {"symbol": "COMI", "features_snapshot": None}
    badges = extract_trade_badges(trade)
    assert badges["is_wyckoff_spring"] is False
    assert badges["wyckoff_badge_ar"] is None
    assert badges["pattern_badge_ar"] is None
    assert badges["channel_badge_ar"] is None
    assert badges["fundamental_badge_ar"] is None
    assert badges["fundamental_score"] is None
    assert badges["smart_money_badge_ar"] is None
    assert badges["smart_money_score"] is None
    assert badges["ict_smc_badge_ar"] is None
    assert badges["elliott_badge_ar"] is None


def test_badges_when_genuine_snapshot_present():
    trade = {
        "symbol": "TMGH",
        "features_snapshot": {
            "is_wyckoff_spring": True,
            "wyckoff_badge_ar": "🏛️ تجميع وايكوف مؤسسي مؤكد",
            "pattern_badge_ar": "☕ نموذج الكوب والعروة",
            "fundamental_badge_ar": "💎 تقييم ممتاز",
            "fundamental_score": 88.0,
            "smart_money_badge_ar": "🏦 تدفق مؤسسي حقيقي",
            "smart_money_score": 91.5
        }
    }
    badges = extract_trade_badges(trade)
    assert badges["is_wyckoff_spring"] is True
    assert badges["wyckoff_badge_ar"] == "🏛️ تجميع وايكوف مؤسسي مؤكد"
    assert badges["pattern_badge_ar"] == "☕ نموذج الكوب والعروة"
    assert badges["fundamental_badge_ar"] == "💎 تقييم ممتاز"
    assert badges["fundamental_score"] == 88.0
    assert badges["smart_money_badge_ar"] == "🏦 تدفق مؤسسي حقيقي"
    assert badges["smart_money_score"] == 91.5


def test_badges_when_partial_snapshot():
    trade = {
        "symbol": "SWDY",
        "features_snapshot": {
            "is_wyckoff_spring": False,
            "smart_money_score": 75.0
        }
    }
    badges = extract_trade_badges(trade)
    assert badges["is_wyckoff_spring"] is False
    assert badges["wyckoff_badge_ar"] is None
    assert badges["pattern_badge_ar"] is None
    assert badges["fundamental_badge_ar"] is None
    assert badges["smart_money_score"] == 75.0
    assert badges["smart_money_badge_ar"] is None


def test_regression_no_hash_or_hardcoded_badges_in_trades_route():
    trades_file = Path(r"E:\zaora\TRADEORA\tradeora-web\app\api\trades\route.ts")
    content = trades_file.read_text(encoding="utf-8")
    
    # Check that forbidden snippets are absent
    forbidden_snippets = [
        "hashIdx",
        "charCodeAt",
        "💎 خصم 28%",
        "smart_money_score || 82.0",
        "fundamental_score || 78.5",
        "hashIdx % 7 === 0",
        "hashIdx % 3 === 0",
        "hashIdx % 5 === 0",
        "hashIdx % 4 === 0"
    ]
    for snippet in forbidden_snippets:
        assert snippet not in content, f"Fabricated badge snippet '{snippet}' found in {trades_file}"
