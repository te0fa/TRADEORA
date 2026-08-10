import pytest
from pathlib import Path

MIN_SAMPLE_SIZE_THRESHOLD = 30

# Replication of statistical win rate resolution from tradeora-web/app/api/screener/route.ts
def resolve_screener_item(company, price, active_trade, closed_trades_for_company):
    change = float(price.get("change_percent") or 0.0)
    
    signal = "neutral"
    signal_type = "price_momentum_rule"
    
    if active_trade and float(active_trade.get("ml_probability") or 0.0) >= 0.82:
        signal = "sell" if active_trade.get("direction") == "sell" else "buy"
        signal_type = "ml_model_v6"
    elif change >= 2.2:
        signal = "buy"
        signal_type = "price_momentum_rule"
    elif change <= -2.2:
        signal = "sell"
        signal_type = "price_momentum_rule"
    elif change > 0.5:
        signal = "buy"
        signal_type = "price_momentum_rule"
    elif change < -0.5:
        signal = "sell"
        signal_type = "price_momentum_rule"
    else:
        signal = "neutral"
        signal_type = "price_momentum_rule"

    total = len(closed_trades_for_company)
    wins = sum(1 for t in closed_trades_for_company if float(t.get("pnl_percent") or 0.0) > 0.0)
    
    is_significant = total >= MIN_SAMPLE_SIZE_THRESHOLD
    win_rate = round((wins / total) * 100.0, 1) if is_significant else None
    
    return {
        "symbol": company.get("symbol"),
        "signal": signal,
        "signal_type": signal_type,
        "win_rate": win_rate,
        "sample_size": total,
        "min_sample_threshold": MIN_SAMPLE_SIZE_THRESHOLD,
        "is_statistically_significant": is_significant
    }


def test_screener_zero_trades():
    item = resolve_screener_item({"symbol": "COMI"}, {"change_percent": 1.5}, None, [])
    assert item["win_rate"] is None
    assert item["sample_size"] == 0
    assert item["is_statistically_significant"] is False
    assert item["signal"] == "buy"
    assert item["signal_type"] == "price_momentum_rule"


def test_screener_single_trade():
    trades = [{"pnl_percent": 4.5}]
    item = resolve_screener_item({"symbol": "COMI"}, {"change_percent": 1.5}, None, trades)
    assert item["win_rate"] is None
    assert item["sample_size"] == 1
    assert item["is_statistically_significant"] is False


def test_screener_insufficient_sample():
    # 25 trades (below threshold of 30)
    trades = [{"pnl_percent": 3.0} for _ in range(18)] + [{"pnl_percent": -2.0} for _ in range(7)]
    item = resolve_screener_item({"symbol": "COMI"}, {"change_percent": -0.8}, None, trades)
    assert item["win_rate"] is None
    assert item["sample_size"] == 25
    assert item["is_statistically_significant"] is False


def test_screener_sufficient_sample():
    # 40 trades (above threshold of 30): 28 wins (70.0%)
    trades = [{"pnl_percent": 4.0} for _ in range(28)] + [{"pnl_percent": -3.0} for _ in range(12)]
    item = resolve_screener_item({"symbol": "COMI"}, {"change_percent": 0.0}, None, trades)
    assert item["win_rate"] == 70.0
    assert item["sample_size"] == 40
    assert item["is_statistically_significant"] is True


def test_screener_distinguishes_ml_signal():
    active_trade = {"direction": "buy", "ml_probability": 0.88}
    item = resolve_screener_item({"symbol": "TMGH"}, {"change_percent": 0.1}, active_trade, [])
    assert item["signal"] == "buy"
    assert item["signal_type"] == "ml_model_v6"


def test_regression_no_fabricated_win_rate_in_screener_route():
    screener_file = Path(r"E:\zaora\TRADEORA\tradeora-web\app\api\screener\route.ts")
    content = screener_file.read_text(encoding="utf-8")
    
    # Check that forbidden snippets are absent
    forbidden_snippets = [
        "signal === 'buy' ? 78",
        "signal === 'sell' ? 72 : 60",
        "?? 78",
        "?? 72",
        "?? 60"
    ]
    for snippet in forbidden_snippets:
        assert snippet not in content, f"Fabricated win rate fallback snippet '{snippet}' found in {screener_file}"
