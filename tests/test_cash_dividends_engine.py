import pytest
import os
import uuid
import psycopg2
import psycopg2.extras
from datetime import date, datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.corporate_actions import adjust_position
from services.dividend_engine import (
    calculate_dividend_cash,
    calculate_total_return,
    record_dividend_income,
    EGYPT_LISTED_DIVIDEND_TAX_RATE,
    get_db_conn
)


def test_egyptian_listed_dividend_tax_math():
    # 1000 shares @ 2.0 EGP/share = 2000 EGP gross. 5% tax = 100 EGP. Net = 1900 EGP.
    calc = calculate_dividend_cash(shares_held=1000, amount_per_share=2.0, withholding_tax_rate=0.05)

    assert calc["gross_amount"] == 2000.0
    assert calc["tax_amount"] == 100.0
    assert calc["net_amount"] == 1900.0
    assert calc["withholding_tax_rate"] == 0.05


def test_total_return_segregation_price_pnl_vs_dividend_pnl():
    # Entry=50 EGP, Exit=55 EGP (1,000 shares). Capital PnL = +5,000 EGP (+10%)
    # Net Dividend = 1,900 EGP (+3.8% yield). Fees = 100 EGP.
    res = calculate_total_return(
        entry_price=50.0,
        exit_price=55.0,
        shares_held=1000,
        net_dividends_egp=1900.0,
        fees_egp=100.0
    )

    assert res["initial_investment_egp"] == 50000.0
    assert res["price_pnl_egp"] == 5000.0
    assert res["price_pnl_pct"] == 10.0
    assert res["net_dividends_egp"] == 1900.0
    assert res["dividend_yield_pct"] == 3.8
    assert res["fees_egp"] == 100.0

    # Total Return = 5000 + 1900 - 100 = 6800 EGP (+13.6%)
    assert res["total_return_egp"] == 6800.0
    assert res["total_return_pct"] == 13.6


def test_concurrent_split_and_cash_dividend_zero_conflict():
    # Initial: 1000 shares @ 100 EGP = 100,000 EGP
    # Step 1: Split 2:1 (Task 05.5A engine)
    split_res = adjust_position(quantity=1000.0, cost_basis=100.0, action_type="SPLIT", ratio=2.0)
    assert split_res["new_quantity"] == 2000.0
    assert split_res["new_cost_basis"] == 50.0
    assert split_res["total_book_value"] == 100000.0

    # Step 2: Cash Dividend on post-split 2000 shares @ 1.50 EGP/share (Task 05.5B engine)
    div_calc = calculate_dividend_cash(shares_held=int(split_res["new_quantity"]), amount_per_share=1.50)
    assert div_calc["gross_amount"] == 3000.0
    assert div_calc["tax_amount"] == 150.0  # 5% of 3000
    assert div_calc["net_amount"] == 2850.0

    # Step 3: Total Return after exit at 52 EGP
    tot_res = calculate_total_return(
        entry_price=split_res["new_cost_basis"],
        exit_price=52.0,
        shares_held=int(split_res["new_quantity"]),
        net_dividends_egp=div_calc["net_amount"]
    )

    # Price PnL = (52 - 50) * 2000 = 4000 EGP (+4.0%)
    # Net Dividend = 2850 EGP (+2.85%)
    # Total Return = 6850 EGP (+6.85%)
    assert tot_res["price_pnl_egp"] == 4000.0
    assert tot_res["net_dividends_egp"] == 2850.0
    assert tot_res["total_return_egp"] == 6850.0
    assert tot_res["total_return_pct"] == 6.85


def test_record_dividend_income_database_persistence():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"
    test_cid = str(uuid.uuid4())
    test_trade_id = str(uuid.uuid4())
    ex_date = date(2026, 5, 10)

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.companies (id, symbol, name_ar, name_en, status, listing_status)
                VALUES (%s, %s, %s, %s, 'active', 'listed');
            """, (test_cid, test_symbol, "شركة تجريبية", "Test Company"))

        # Record dividend
        calc = record_dividend_income(
            company_id=test_cid,
            symbol=test_symbol,
            ex_date=ex_date,
            shares_held=500,
            amount_per_share=4.0,
            trade_id=test_trade_id,
            conn=conn
        )

        assert calc["gross_amount"] == 2000.0
        assert calc["tax_amount"] == 100.0
        assert calc["net_amount"] == 1900.0

        # Verify DB persistence in public.dividend_income_ledger
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT * FROM public.dividend_income_ledger WHERE symbol = %s AND trade_id = %s;", (test_symbol, test_trade_id))
            row = cur.fetchone()
            assert row is not None
            assert float(row["gross_amount"]) == 2000.0
            assert float(row["tax_amount"]) == 100.0
            assert float(row["net_amount"]) == 1900.0

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.dividend_income_ledger WHERE symbol = %s;", (test_symbol,))
            cur.execute("DELETE FROM public.corporate_actions WHERE symbol = %s;", (test_symbol,))
            cur.execute("DELETE FROM public.companies WHERE id = %s;", (test_cid,))
        conn.close()
