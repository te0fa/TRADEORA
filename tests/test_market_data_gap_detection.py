import pytest
import os
import uuid
import psycopg2
import psycopg2.extras
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.calendar import (
    is_trading_day,
    OFFICIAL_HOLIDAYS_2026
)
from services.gap_detector import (
    detect_gaps_in_window,
    get_active_equities,
    get_db_conn
)


def test_zero_false_positives_for_holidays_and_weekends():
    # 2026-06-05 is Friday, 2026-07-23 is July 23 Revolution
    friday = date(2026, 6, 5)
    holiday = date(2026, 7, 23)

    assert is_trading_day(friday) is False
    assert is_trading_day(holiday) is False

    # Scanning exclusively over weekends/holidays must return 0 valid trading days and 0 gaps
    res = detect_gaps_in_window(start_date=friday, end_date=friday)
    assert res["valid_trading_days_count"] == 0
    assert res["gaps_found"] == 0

    res_h = detect_gaps_in_window(start_date=holiday, end_date=holiday)
    assert res_h["valid_trading_days_count"] == 0
    assert res_h["gaps_found"] == 0


def test_missing_trading_day_detection_and_db_alert():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    assert conn is not None

    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"
    test_cid = str(uuid.uuid4())
    test_date = date(2026, 6, 2)  # Tuesday, valid trading day

    try:
        with conn.cursor() as cur:
            # Insert dummy active company
            cur.execute("""
                INSERT INTO public.companies (id, symbol, name_ar, name_en, status, listing_status)
                VALUES (%s, %s, %s, %s, 'active', 'listed');
            """, (test_cid, test_symbol, "شركة تجريبية", "Test Company"))

        # Run gap scan specifically for this test symbol on valid trading day
        res = detect_gaps_in_window(start_date=test_date, end_date=test_date, target_symbols=[test_symbol], conn=conn)

        assert res["gaps_found"] == 1
        gap = res["gaps"][0]
        assert gap["symbol"] == test_symbol
        assert gap["gap_type"] == "MISSING_DAY"
        assert gap["severity"] == "HIGH"

        # Verify DB persistence in public.market_data_gaps
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT * FROM public.market_data_gaps
                WHERE symbol = %s AND gap_date = %s AND gap_type = 'MISSING_DAY';
            """, (test_symbol, test_date))
            row = cur.fetchone()
            assert row is not None
            assert row["severity"] == "HIGH"

    finally:
        # Cleanup
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.market_data_gaps WHERE symbol = %s;", (test_symbol,))
            cur.execute("DELETE FROM public.companies WHERE id = %s;", (test_cid,))
        conn.close()


def test_incomplete_ohlc_gap_detection():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"
    test_cid = str(uuid.uuid4())
    test_date = date(2026, 6, 2)  # Tuesday, valid trading day

    try:
        with conn.cursor() as cur:
            # 1. Insert dummy active company
            cur.execute("""
                INSERT INTO public.companies (id, symbol, name_ar, name_en, status, listing_status)
                VALUES (%s, %s, %s, %s, 'active', 'listed');
            """, (test_cid, test_symbol, "شركة تجريبية", "Test Company"))

            # 2. Insert incomplete candle (missing open_price and high_price)
            cur.execute("""
                INSERT INTO public.market_prices (company_id, price_date, close_price, source)
                VALUES (%s, %s, %s, %s);
            """, (test_cid, test_date, 50.0, "tradingview_1d"))

        # Run gap scan
        res = detect_gaps_in_window(start_date=test_date, end_date=test_date, target_symbols=[test_symbol], conn=conn)

        assert res["gaps_found"] == 1
        gap = res["gaps"][0]
        assert gap["symbol"] == test_symbol
        assert gap["gap_type"] == "INCOMPLETE_OHLC"

    finally:
        # Cleanup
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.market_prices WHERE company_id = %s;", (test_cid,))
            cur.execute("DELETE FROM public.market_data_gaps WHERE symbol = %s;", (test_symbol,))
            cur.execute("DELETE FROM public.companies WHERE id = %s;", (test_cid,))
        conn.close()
