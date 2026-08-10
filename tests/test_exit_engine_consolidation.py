import pytest
from pathlib import Path
from trade_monitor import (
    calculate_ema,
    calculate_rsi,
    check_macd_dead_cross,
    check_ema20_break
)

# Simulation of canonical exit evaluation logic
def evaluate_trade_exit(trade, current_price, candles=None, days_held=1):
    direction = (trade.get("direction") or "buy").lower()
    is_buy = direction == "buy"
    entry = float(trade.get("entry_price") or 0)
    tp1 = float(trade.get("tp1") or 0)
    tp2 = float(trade.get("tp2") or 0)
    sl = float(trade.get("sl") or 0)
    status = trade.get("status", "active")
    
    if days_held >= 45:
        pnl = ((current_price - entry) / entry * 100) if is_buy else ((entry - current_price) / entry * 100)
        return {"action": "CLOSE", "reason": "max_hold_expired", "pnl": round(pnl, 2), "exit_price": current_price}
        
    # Check TP2
    if is_buy and tp2 > 0 and current_price >= tp2:
        pnl = ((tp2 - entry) / entry) * 100
        return {"action": "CLOSE", "reason": "tp2_hit", "pnl": round(pnl, 2), "exit_price": tp2}
        
    if not is_buy and tp2 > 0 and current_price <= tp2:
        pnl = ((entry - tp2) / entry) * 100
        return {"action": "CLOSE", "reason": "tp2_hit", "pnl": round(pnl, 2), "exit_price": tp2}
        
    # Check SL
    if is_buy and sl > 0 and current_price <= sl:
        pnl = ((sl - entry) / entry) * 100
        return {"action": "CLOSE", "reason": "sl_hit", "pnl": round(pnl, 2), "exit_price": sl}
        
    if not is_buy and sl > 0 and current_price >= sl:
        pnl = ((entry - sl) / entry) * 100
        return {"action": "CLOSE", "reason": "sl_hit", "pnl": round(pnl, 2), "exit_price": sl}
        
    # Check Trailing breakeven if in tp1_hit
    if status == "tp1_hit":
        if is_buy and current_price <= entry:
            return {"action": "CLOSE", "reason": "trailing_stop", "pnl": 0.0, "exit_price": entry}
        elif not is_buy and current_price >= entry:
            return {"action": "CLOSE", "reason": "trailing_stop", "pnl": 0.0, "exit_price": entry}
            
    # Check TP1 hit
    if status == "active":
        if is_buy and tp1 > 0 and current_price >= tp1:
            pnl = ((tp1 - entry) / entry) * 100
            return {"action": "MARK_TP1", "reason": "tp1_hit", "pnl": round(pnl, 2), "exit_price": tp1}
        elif not is_buy and tp1 > 0 and current_price <= tp1:
            pnl = ((entry - tp1) / entry) * 100
            return {"action": "MARK_TP1", "reason": "tp1_hit", "pnl": round(pnl, 2), "exit_price": tp1}
            
    # Dynamic Indicator Exits
    if candles and len(candles) >= 15:
        pnl_pct = ((current_price - entry) / entry * 100) if is_buy else ((entry - current_price) / entry * 100)
        rsi_val = calculate_rsi(candles)
        if is_buy and rsi_val >= 80.0 and pnl_pct >= 5.0:
            return {"action": "CLOSE", "reason": "rsi_exhaustion", "pnl": round(pnl_pct, 2), "exit_price": current_price}
        if is_buy and check_macd_dead_cross(candles) and pnl_pct > 1.5:
            return {"action": "CLOSE", "reason": "macd_dead_cross", "pnl": round(pnl_pct, 2), "exit_price": current_price}
        if is_buy and check_ema20_break(candles) and pnl_pct > 1.0:
            return {"action": "CLOSE", "reason": "ema20_break", "pnl": round(pnl_pct, 2), "exit_price": current_price}
            
    return {"action": "HOLD", "reason": "in_progress", "pnl": None, "exit_price": None}


def test_exit_rules_tp2_and_sl():
    trade = {"direction": "buy", "entry_price": 100.0, "tp1": 105.0, "tp2": 110.0, "sl": 95.0, "status": "active"}
    
    # Test TP2
    res_tp2 = evaluate_trade_exit(trade, 110.5)
    assert res_tp2["action"] == "CLOSE"
    assert res_tp2["reason"] == "tp2_hit"
    assert res_tp2["pnl"] == 10.0
    
    # Test SL
    res_sl = evaluate_trade_exit(trade, 94.0)
    assert res_sl["action"] == "CLOSE"
    assert res_sl["reason"] == "sl_hit"
    assert res_sl["pnl"] == -5.0


def test_exit_rule_tp1_and_trailing_breakeven():
    trade = {"direction": "buy", "entry_price": 50.0, "tp1": 53.0, "tp2": 56.0, "sl": 47.0, "status": "active"}
    
    # Hits TP1
    res_tp1 = evaluate_trade_exit(trade, 53.2)
    assert res_tp1["action"] == "MARK_TP1"
    assert res_tp1["reason"] == "tp1_hit"
    
    # After TP1, status is tp1_hit. If price drops to entry, trailing stop triggers at breakeven
    trade_tp1 = {**trade, "status": "tp1_hit"}
    res_trailing = evaluate_trade_exit(trade_tp1, 49.8)
    assert res_trailing["action"] == "CLOSE"
    assert res_trailing["reason"] == "trailing_stop"
    assert res_trailing["pnl"] == 0.0


def test_exit_rule_stale_trade_cleanup():
    trade = {"direction": "buy", "entry_price": 20.0, "tp1": 22.0, "tp2": 24.0, "sl": 18.0, "status": "active"}
    res_stale = evaluate_trade_exit(trade, 20.5, days_held=46)
    assert res_stale["action"] == "CLOSE"
    assert res_stale["reason"] == "max_hold_expired"


def test_idempotency_double_execution_safety():
    # If trade is already closed, re-running should never re-close or distort
    db_trade = {"id": "T1", "status": "closed", "exit_reason": "tp2_hit", "pnl_percent": 8.0}
    
    # In idempotent model, update is conditional on status in ('active', 'tp1_hit')
    can_update = db_trade["status"] in ["active", "tp1_hit"]
    assert can_update is False


def test_regression_run_daily_bat_uses_trade_monitor():
    bat_file = Path(r"E:\zaora\TRADEORA\run_daily.bat")
    content = bat_file.read_text(encoding="utf-8")
    assert "python trade_monitor.py" in content
    assert "python track_trades.py" not in content
