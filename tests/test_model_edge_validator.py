import pytest
import os
import json
import uuid
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.model_edge_validator import (
    calculate_expectancy,
    calculate_profit_factor,
    calculate_max_drawdown,
    calculate_sharpe_and_sortino,
    run_bootstrap_confidence_interval,
    run_monte_carlo_p_value_test,
    evaluate_gate_5_model_edge,
    RISK_FREE_RATE_EGYPT_ANNUAL
)
from services.backtest_engine import get_db_conn


def test_expectancy_multi_metric_math_beyond_win_rate():
    # Case A: Win Rate = 40% (0.40) but Avg Win = +5.0% and Avg Loss = -1.0% -> Profitable System!
    trades_profitable = [
        {"net_pnl_pct": 5.0, "is_win": True},
        {"net_pnl_pct": 5.0, "is_win": True},
        {"net_pnl_pct": -1.0, "is_win": False},
        {"net_pnl_pct": -1.0, "is_win": False},
        {"net_pnl_pct": -1.0, "is_win": False}
    ]
    exp_a = calculate_expectancy(trades_profitable)
    assert exp_a["expectancy_pct"] > 0 # E = (0.4 * 5.0) - (0.6 * 1.0) = 2.0 - 0.6 = +1.4%

    # Case B: Win Rate = 60% (0.60) but Avg Win = +0.5% and Avg Loss = -3.0% -> Losing System!
    trades_losing = [
        {"net_pnl_pct": 0.5, "is_win": True},
        {"net_pnl_pct": 0.5, "is_win": True},
        {"net_pnl_pct": 0.5, "is_win": True},
        {"net_pnl_pct": -3.0, "is_win": False},
        {"net_pnl_pct": -3.0, "is_win": False}
    ]
    exp_b = calculate_expectancy(trades_losing)
    assert exp_b["expectancy_pct"] < 0 # E = (0.6 * 0.5) - (0.4 * 3.0) = 0.3 - 1.2 = -0.9%


def test_profit_factor_and_max_drawdown_math():
    trades = [
        {"net_pnl_egp": 1000.0, "is_win": True},
        {"net_pnl_egp": 500.0, "is_win": True},
        {"net_pnl_egp": -300.0, "is_win": False}
    ]
    pf = calculate_profit_factor(trades)
    assert pf == round(1500.0 / 300.0, 4) # 5.0

    equity_curve = [100000, 105000, 95000, 102000]
    mdd = calculate_max_drawdown(equity_curve)
    assert mdd == -9.52 # (95000 - 105000) / 105000 = -9.52%


def test_bootstrap_confidence_interval_and_monte_carlo():
    trades = [
        {"net_pnl_pct": 2.5, "is_win": True},
        {"net_pnl_pct": 1.5, "is_win": True},
        {"net_pnl_pct": -0.5, "is_win": False},
        {"net_pnl_pct": 3.0, "is_win": True},
        {"net_pnl_pct": -1.0, "is_win": False}
    ]
    ci = run_bootstrap_confidence_interval(trades, n_resamples=200)
    assert "ci_lower_95" in ci
    assert "ci_upper_95" in ci
    assert ci["ci_lower_95"] <= ci["ci_upper_95"]

    mc = run_monte_carlo_p_value_test(actual_return_pct=5.5, trades=trades, n_permutations=200)
    assert "p_value" in mc
    assert "statistically_significant" in mc


def test_evaluate_gate_5_model_edge_report_generation():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_company_id = str(uuid.uuid4())
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.companies (id, symbol, name_en, name_ar, sector, status)
                VALUES (%s, %s, 'Edge Test Co', 'شركة تجريبية حواف', 'Banking', 'active');
            """, (test_company_id, test_symbol))

            for d in range(1, 20):
                d_str = f"2026-05-{d:02d}"
                cur.execute("""
                    INSERT INTO public.market_prices (
                        company_id, price_date, open_price, high_price, low_price, close_price, volume, source
                    ) VALUES (%s, %s, 10.0, 10.5, 9.8, 10.2, 10000, 'tradingview_1d')
                    ON CONFLICT DO NOTHING;
                """, (test_company_id, d_str))

        res = evaluate_gate_5_model_edge(
            symbols=[test_symbol],
            start_date="2026-05-01",
            end_date="2026-05-20",
            conn=conn
        )

        assert "gate_status" in res
        assert "expectancy_metrics" in res
        assert "profit_factor" in res
        assert "bootstrap_95_ci" in res
        assert "monte_carlo_test" in res

        # Verify Gate 5 Validation Artifact written to disk
        report_path = Path(__file__).parent.parent / "models" / "gate5_validation_report.json"
        assert report_path.exists()
        saved = json.loads(report_path.read_text(encoding="utf-8"))
        assert saved["gate_status"] in ["APPROVED", "BLOCKED"]

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.market_prices WHERE company_id = %s;", (test_company_id,))
            cur.execute("DELETE FROM public.companies WHERE id = %s;", (test_company_id,))
        conn.close()
