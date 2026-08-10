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

from services.fundamentals_pit import (
    get_fundamentals_as_of,
    record_fundamental_snapshot,
    get_db_conn
)


def cleanup_test_data(conn, symbol, cid):
    with conn.cursor() as cur:
        cur.execute("ALTER TABLE public.fundamentals_snapshots DISABLE TRIGGER trg_prevent_fundamentals_update;")
        cur.execute("DELETE FROM public.fundamentals_snapshots WHERE symbol = %s;", (symbol,))
        cur.execute("ALTER TABLE public.fundamentals_snapshots ENABLE TRIGGER trg_prevent_fundamentals_update;")
        cur.execute("DELETE FROM public.companies WHERE id = %s;", (cid,))


def test_strict_null_rule_prevents_lookahead_bias():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"
    test_cid = str(uuid.uuid4())
    disclosure_date = date(2026, 5, 15)  # Disclosed on 2026-05-15

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.companies (id, symbol, name_ar, name_en, status, listing_status)
                VALUES (%s, %s, %s, %s, 'active', 'listed');
            """, (test_cid, test_symbol, "شركة تجريبية", "Test Company"))

        # Record genuine snapshot disclosed on 2026-05-15
        snap = record_fundamental_snapshot(
            company_id=test_cid,
            symbol=test_symbol,
            period_year=2025,
            period_type="FY",
            effective_date=disclosure_date,
            pe_ratio=8.5,
            eps=3.20,
            disclosure_source="EGX Official Audited Financial Report 2025",
            conn=conn
        )
        assert snap is not None

        # Query 1: As of 2026-05-14 (1 day PRIOR to disclosure date)
        # MUST strictly return None (NULL) to eliminate Look-ahead bias
        prior_pit = get_fundamentals_as_of(symbol=test_symbol, as_of_date=date(2026, 5, 14), conn=conn)
        assert prior_pit is None

        # Query 2: As of 2026-05-15 (Exact disclosure date)
        exact_pit = get_fundamentals_as_of(symbol=test_symbol, as_of_date=date(2026, 5, 15), conn=conn)
        assert exact_pit is not None
        assert float(exact_pit["pe_ratio"]) == 8.5

        # Query 3: As of 2026-06-01 (Subsequent date)
        later_pit = get_fundamentals_as_of(symbol=test_symbol, as_of_date=date(2026, 6, 1), conn=conn)
        assert later_pit is not None
        assert float(later_pit["pe_ratio"]) == 8.5

    finally:
        cleanup_test_data(conn, test_symbol, test_cid)
        conn.close()


def test_immutability_trigger_blocks_updates_and_deletes():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"
    test_cid = str(uuid.uuid4())
    disclosure_date = date(2026, 5, 15)

    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.companies (id, symbol, name_ar, name_en, status, listing_status)
                VALUES (%s, %s, %s, %s, 'active', 'listed');
            """, (test_cid, test_symbol, "شركة تجريبية", "Test Company"))

        snap = record_fundamental_snapshot(
            company_id=test_cid,
            symbol=test_symbol,
            period_year=2025,
            period_type="FY",
            effective_date=disclosure_date,
            pe_ratio=8.5,
            conn=conn
        )
        snap_id = snap["id"]

        # Attempting UPDATE on immutable snapshot MUST fail
        with conn.cursor() as cur:
            with pytest.raises(psycopg2.Error) as exc_info:
                cur.execute("UPDATE public.fundamentals_snapshots SET pe_ratio = 10.0 WHERE id = %s;", (snap_id,))
            assert "FUNDAMENTALS_SNAPSHOT_IMMUTABLE" in str(exc_info.value) or "strictly prohibited" in str(exc_info.value)

        # Connection is in aborted state after error; reconnect for cleanup
        conn.close()
        conn = get_db_conn()

    finally:
        if conn:
            cleanup_test_data(conn, test_symbol, test_cid)
            conn.close()
