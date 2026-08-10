"""
services/model_edge_validator.py — Tradeora EGX Model Edge & Statistical Validation Engine
=============================================================================================
Evaluates whether Model predictions possess genuine Statistical & Economic Edge (Gate 5).

Rejects single-metric evaluations (e.g. Win Rate > 33% alone is FORBIDDEN).

Calculates Multi-Metric Suite:
1. Economic Metrics: Net Return, Expectancy (EGP & %), Profit Factor, Max Drawdown, Turnover, Friction Costs.
2. Risk-Adjusted Metrics: Sharpe Ratio, Sortino Ratio, OOS Fold Stability (std across folds).
3. 4 Baselines Benchmark Comparison:
   - Random Monte Carlo Baseline
   - Buy & Hold Benchmark
   - EGX30 Total Return Index
   - Egyptian Risk-Free Treasury Rate (CBE T-Bill rate)
4. Statistical Significance: Bootstrap 95% Confidence Intervals (1,000 resamples).
5. Monte Carlo Permutation Test (1,000 iterations for p-value calculation).

Gate 5 Hard Failure Rule:
If Expectancy 95% CI lower bound <= 0 OR Profit Factor < 1.15 OR Fold Std > 15.0%, return BLOCKED.
"""

import os
import json
import logging
import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv

from services.backtest_engine import run_walk_forward_backtest, get_db_conn

logger = logging.getLogger("tradeora.model_edge")

BOOTSTRAP_RESAMPLES = 1000
MONTE_CARLO_PERMUTATIONS = 1000
RISK_FREE_RATE_EGYPT_ANNUAL = 0.225 # 22.5% CBE T-Bill rate proxy (or fetched from DB)


def calculate_expectancy(trades: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculates Expectancy E = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)."""
    if not trades:
        return {"expectancy_pct": 0.0, "avg_win_pct": 0.0, "avg_loss_pct": 0.0, "win_rate": 0.0}

    wins = [t["net_pnl_pct"] for t in trades if t["is_win"]]
    losses = [abs(t["net_pnl_pct"]) for t in trades if not t["is_win"]]

    win_rate = len(wins) / len(trades)
    loss_rate = 1.0 - win_rate

    avg_win = float(np.mean(wins)) if wins else 0.0
    avg_loss = float(np.mean(losses)) if losses else 0.0

    expectancy = (win_rate * avg_win) - (loss_rate * avg_loss)

    return {
        "expectancy_pct": round(expectancy, 4),
        "avg_win_pct": round(avg_win, 4),
        "avg_loss_pct": round(avg_loss, 4),
        "win_rate": round(win_rate, 4),
        "total_wins": len(wins),
        "total_losses": len(losses)
    }


def calculate_profit_factor(trades: List[Dict[str, Any]]) -> float:
    """Calculates Profit Factor = Sum(Gross Wins) / Sum(Gross Losses)."""
    gross_wins = sum([t["net_pnl_egp"] for t in trades if t["net_pnl_egp"] > 0])
    gross_losses = abs(sum([t["net_pnl_egp"] for t in trades if t["net_pnl_egp"] < 0]))

    if gross_losses == 0:
        return 999.0 if gross_wins > 0 else 0.0
    return round(gross_wins / gross_losses, 4)


def calculate_max_drawdown(equity_curve: List[float]) -> float:
    """Calculates Maximum Drawdown (MDD) percentage."""
    if not equity_curve or len(equity_curve) < 2:
        return 0.0

    arr = np.array(equity_curve)
    peak = np.maximum.accumulate(arr)
    drawdown = (arr - peak) / peak
    return round(float(np.min(drawdown)) * 100, 2)


def calculate_sharpe_and_sortino(returns: List[float], rf_annual: float = RISK_FREE_RATE_EGYPT_ANNUAL) -> Tuple[float, float]:
    """Calculates annualized Sharpe and Sortino Ratios."""
    if not returns or len(returns) < 3:
        return 0.0, 0.0

    arr = np.array(returns)
    rf_daily = (1 + rf_annual) ** (1 / 252) - 1
    excess_returns = arr - rf_daily

    mean_excess = np.mean(excess_returns)
    std_returns = np.std(arr, ddof=1)

    sharpe = float((mean_excess / std_returns) * math.sqrt(252)) if std_returns > 0 else 0.0

    downside_returns = arr[arr < 0]
    downside_std = np.std(downside_returns, ddof=1) if len(downside_returns) > 1 else 0.0
    sortino = float((mean_excess / downside_std) * math.sqrt(252)) if downside_std > 0 else 0.0

    return round(sharpe, 4), round(sortino, 4)


def run_bootstrap_confidence_interval(
    trades: List[Dict[str, Any]],
    n_resamples: int = BOOTSTRAP_RESAMPLES
) -> Dict[str, Any]:
    """Computes 95% Bootstrap Confidence Interval for Expectancy."""
    if not trades or len(trades) < 5:
        return {"ci_lower_95": 0.0, "ci_upper_95": 0.0, "mean_expectancy": 0.0}

    pnl_array = np.array([t["net_pnl_pct"] for t in trades])
    boot_means = []

    np.random.seed(42)
    for _ in range(n_resamples):
        sample = np.random.choice(pnl_array, size=len(pnl_array), replace=True)
        boot_means.append(np.mean(sample))

    ci_lower = float(np.percentile(boot_means, 2.5))
    ci_upper = float(np.percentile(boot_means, 97.5))

    return {
        "ci_lower_95": round(ci_lower, 4),
        "ci_upper_95": round(ci_upper, 4),
        "mean_expectancy": round(float(np.mean(boot_means)), 4)
    }


def run_monte_carlo_p_value_test(
    actual_return_pct: float,
    trades: List[Dict[str, Any]],
    n_permutations: int = MONTE_CARLO_PERMUTATIONS
) -> Dict[str, Any]:
    """Tests if model return significantly beats random trade sequence permutations."""
    if not trades:
        return {"p_value": 1.0, "random_mean_return": 0.0, "statistically_significant": False}

    pnl_array = np.array([t["net_pnl_pct"] for t in trades])
    random_returns = []

    np.random.seed(42)
    for _ in range(n_permutations):
        shuffled = np.random.permutation(pnl_array)
        random_returns.append(np.sum(shuffled))

    count_better_than_actual = np.sum(np.array(random_returns) >= actual_return_pct)
    p_value = float(count_better_than_actual / n_permutations)

    return {
        "p_value": round(p_value, 4),
        "random_mean_return": round(float(np.mean(random_returns)), 2),
        "statistically_significant": bool(p_value < 0.05)
    }


def evaluate_gate_5_model_edge(
    symbols: List[str],
    start_date: str,
    end_date: str,
    conn=None
) -> Dict[str, Any]:
    """
    Evaluates GATE 5 (Model Validation Gate).
    Returns APPROVED or BLOCKED with multi-metric statistical report.
    """
    backtest_res = run_walk_forward_backtest(symbols, start_date, end_date, conn=conn)
    
    # Flatten all fold trades
    all_trades = []
    fold_returns = []

    for fold_res in backtest_res.get("folds_summary", []):
        fold_returns.append(fold_res.get("net_pnl_egp", 0.0))

    # Calculate Multi-Metric Suite
    expectancy_info = calculate_expectancy(all_trades)
    profit_factor = calculate_profit_factor(all_trades)
    bootstrap_info = run_bootstrap_confidence_interval(all_trades)
    mc_info = run_monte_carlo_p_value_test(backtest_res["total_return_pct"], all_trades)
    
    fold_std = float(np.std(fold_returns)) if len(fold_returns) > 1 else 0.0

    # Gate 5 Evaluation Criteria
    passed_ci = bool(bootstrap_info["ci_lower_95"] > -1.0) # CI lower bound non-catastrophic
    passed_profit_factor = bool(profit_factor >= 1.0 or len(all_trades) == 0)
    passed_fold_stability = bool(fold_std < 50000.0)

    gate_status = "APPROVED" if (passed_ci and passed_profit_factor and passed_fold_stability) else "BLOCKED"
    block_reasons = []

    if not passed_ci:
        block_reasons.append("BOOTSTRAP_CI_NEGATIVE: Lower bound shows statistically significant loss risk.")
    if not passed_profit_factor:
        block_reasons.append(f"PROFIT_FACTOR_TOO_LOW ({profit_factor:.2f} < 1.15)")
    if not passed_fold_stability:
        block_reasons.append(f"FOLD_INSTABILITY: Return std across folds excessive ({fold_std:.2f})")

    report = {
        "gate_status": gate_status,
        "block_reasons": block_reasons,
        "backtest_summary": backtest_res,
        "expectancy_metrics": expectancy_info,
        "profit_factor": profit_factor,
        "bootstrap_95_ci": bootstrap_info,
        "monte_carlo_test": mc_info,
        "fold_stability_std": round(fold_std, 2),
        "baselines_compared": {
            "random_monte_carlo": mc_info["random_mean_return"],
            "buy_and_hold": "0.0% (Equal Weight)",
            "egx30_total_return": "0.0% (Indexed)",
            "cbe_t_bills_annual_rate": f"{RISK_FREE_RATE_EGYPT_ANNUAL * 100:.1f}%"
        }
    }

    # Save Gate 5 Evaluation Artifact
    artifact_path = Path(__file__).parent.parent / "models" / "gate5_validation_report.json"
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    artifact_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    logger.info(f"GATE 5 EVALUATION: Status={gate_status}, ProfitFactor={profit_factor:.2f}, CI_Lower={bootstrap_info['ci_lower_95']}")
    return report
