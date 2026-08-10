import pytest
import os
import json
import uuid
import psycopg2
import psycopg2.extras
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.backtest_engine import (
    fetch_canonical_price_history,
    generate_walk_forward_folds,
    run_walk_forward_backtest,
    FORBIDDEN_VENDORS,
    BROKERAGE_FEE_PCT,
    SLIPPAGE_PCT,
    FIXED_FEE_EGP,
    get_db_conn
)


def test_forbidden_vendors_exclusion_in_backtest_fetch():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_company_id = str(uuid.uuid4())
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"

    try:
        # Seed test company & daily candles in market_prices from valid and forbidden sources
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.companies (id, symbol, name_en, name_ar, sector, status)
                VALUES (%s, %s, 'Test Co', 'شركة تجريبية', 'Banking', 'active');
            """, (test_company_id, test_symbol))

            # Valid source: tradingview_1d
            cur.execute("""
                INSERT INTO public.market_prices (
                    company_id, price_date, open_price, high_price, low_price, close_price, volume, source
                ) VALUES (%s, '2026-06-01', 10.0, 10.5, 9.8, 10.2, 1000, 'tradingview_1d');
            """, (test_company_id,))

            # Forbidden source: mubasher
            cur.execute("""
                INSERT INTO public.market_prices (
                    company_id, price_date, open_price, high_price, low_price, close_price, volume, source
                ) VALUES (%s, '2026-06-02', 12.0, 12.5, 11.8, 12.2, 5000, 'mubasher');
            """, (test_company_id,))

        # Fetch canonical price history
        df = fetch_canonical_price_history(test_symbol, "2026-06-01", "2026-06-05", conn=conn)

        assert not df.empty
        # 'mubasher' source record MUST be filtered out cleanly
        sources = list(df['data_source'].str.lower())
        assert "mubasher" not in sources
        assert "tradingview_1d" in sources

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.market_prices WHERE company_id = %s;", (test_company_id,))
            cur.execute("DELETE FROM public.companies WHERE id = %s;", (test_company_id,))
        conn.close()


def test_walk_forward_folds_generation_isolation():
    folds = generate_walk_forward_folds(
        start_date="2026-01-01",
        end_date="2026-06-01",
        n_folds=3,
        train_ratio=0.60,
        purge_days=5
    )

    assert len(folds) >= 1
    for f in folds:
        assert "fold_index" in f
        assert f["train_start"] <= f["train_end"]
        assert f["purged_gap_start"] <= f["purged_gap_end"]
        assert f["oos_start"] <= f["oos_end"]
        # Guarantee Purged Gap exists between Train and OOS Test
        assert f["train_end"] < f["purged_gap_start"]
        assert f["purged_gap_end"] < f["oos_start"]


def test_full_walk_forward_backtest_execution_and_report():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_company_id = str(uuid.uuid4())
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"

    try:
        # Seed test company & 20 trading days of valid candles for test_symbol
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.companies (id, symbol, name_en, name_ar, sector, status)
                VALUES (%s, %s, 'Test Co 2', 'شركة تجريبية 2', 'Banking', 'active');
            """, (test_company_id, test_symbol))

            for d in range(1, 20):
                d_str = f"2026-05-{d:02d}"
                cur.execute("""
                    INSERT INTO public.market_prices (
                        company_id, price_date, open_price, high_price, low_price, close_price, volume, source
                    ) VALUES (%s, %s, 10.0, 10.5, 9.8, 10.2, 10000, 'tradingview_1d')
                    ON CONFLICT DO NOTHING;
                """, (test_company_id, d_str))

        # Run Walk-Forward Backtest
        res = run_walk_forward_backtest(
            symbols=[test_symbol],
            start_date="2026-05-01",
            end_date="2026-05-20",
            initial_capital=100000.0,
            buy_threshold=0.60,
            conn=conn
        )

        assert res["initial_capital"] == 100000.0
        assert "total_return_pct" in res
        assert "overall_win_rate" in res
        assert "total_friction_paid_egp" in res

        # Verify Audit Report Artifact written to disk
        report_path = Path(__file__).parent.parent / "models" / "backtest_audit_report.json"
        assert report_path.exists()
        saved = json.loads(report_path.read_text(encoding="utf-8"))
        assert saved["initial_capital"] == 100000.0

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.market_prices WHERE company_id = %s;", (test_company_id,))
            cur.execute("DELETE FROM public.companies WHERE id = %s;", (test_company_id,))
        conn.close()
