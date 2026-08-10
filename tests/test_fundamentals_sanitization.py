import pytest
from pathlib import Path

# Replication of fundamentals sanitization logic from tradeora-web/lib/queries.ts
def sanitize_fundamentals(raw_fundamentals):
    if raw_fundamentals is None:
        return None
        
    fundamentals = dict(raw_fundamentals)
    
    fundamentals["debt_equity"] = fundamentals.get("debt_to_equity") or fundamentals.get("debt_equity") or None
    
    if fundamentals.get("profit_margin") is None and fundamentals.get("net_income") and fundamentals.get("revenue"):
        try:
            fundamentals["profit_margin"] = round((float(fundamentals["net_income"]) / float(fundamentals["revenue"])) * 100, 2)
        except Exception:
            fundamentals["profit_margin"] = None
            
    fundamentals["debt_equity"] = float(fundamentals["debt_equity"]) if fundamentals.get("debt_equity") is not None else None
    fundamentals["profit_margin"] = float(fundamentals["profit_margin"]) if fundamentals.get("profit_margin") is not None else None
    fundamentals["revenue_growth"] = float(fundamentals["revenue_growth"]) if fundamentals.get("revenue_growth") is not None else None
    fundamentals["earnings_growth"] = float(fundamentals["earnings_growth"]) if fundamentals.get("earnings_growth") is not None else None
    fundamentals["pe_ratio"] = float(fundamentals["pe_ratio"]) if fundamentals.get("pe_ratio") is not None else None
    fundamentals["eps"] = float(fundamentals["eps"]) if fundamentals.get("eps") is not None else None
    fundamentals["dividend_yield"] = float(fundamentals["dividend_yield"]) if fundamentals.get("dividend_yield") is not None else None
    fundamentals["fair_value"] = float(fundamentals["fair_value"]) if fundamentals.get("fair_value") is not None else None
    
    return fundamentals


def test_fundamentals_when_none():
    res = sanitize_fundamentals(None)
    assert res is None


def test_fundamentals_when_empty_dict():
    res = sanitize_fundamentals({})
    assert res["debt_equity"] is None
    assert res["profit_margin"] is None
    assert res["revenue_growth"] is None
    assert res["earnings_growth"] is None
    assert res["pe_ratio"] is None
    assert res["fair_value"] is None


def test_fundamentals_when_complete():
    raw = {
        "debt_to_equity": 0.45,
        "profit_margin": 22.4,
        "revenue_growth": 15.1,
        "earnings_growth": 18.2,
        "pe_ratio": 8.5,
        "eps": 16.5,
        "dividend_yield": 6.2,
        "fair_value": 175.0
    }
    res = sanitize_fundamentals(raw)
    assert res["debt_equity"] == 0.45
    assert res["profit_margin"] == 22.4
    assert res["revenue_growth"] == 15.1
    assert res["earnings_growth"] == 18.2
    assert res["pe_ratio"] == 8.5
    assert res["fair_value"] == 175.0


def test_fundamentals_when_partial_and_calculated():
    raw = {
        "debt_to_equity": 0.20,
        "net_income": 5000000,
        "revenue": 20000000,
        "profit_margin": None,
        "revenue_growth": None,
        "earnings_growth": None
    }
    res = sanitize_fundamentals(raw)
    assert res["debt_equity"] == 0.20
    assert res["profit_margin"] == 25.0  # (5M / 20M) * 100
    assert res["revenue_growth"] is None
    assert res["earnings_growth"] is None


def test_regression_no_hardcoded_fundamentals_in_queries():
    queries_file = Path(r"E:\zaora\TRADEORA\tradeora-web\lib\queries.ts")
    content = queries_file.read_text(encoding="utf-8")
    
    # Check that fabricated fallback expressions are absent
    forbidden_snippets = [
        "debt_equity ?? 0.38",
        "profit_margin ?? 18.5",
        "revenue_growth ?? 11.2",
        "earnings_growth ?? 14.6"
    ]
    for snippet in forbidden_snippets:
        assert snippet not in content, f"Fabricated fundamental fallback '{snippet}' found in {queries_file}"
