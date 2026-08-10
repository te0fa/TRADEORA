import pytest
import os
import uuid
import psycopg2
import psycopg2.extras
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

DATABASE_URL = os.getenv('DATABASE_URL')

from services.trade_plan_service import (
    get_trade_plan,
    update_trade_plan,
    revise_trade_plan,
    TradePlanImmutableError,
    get_db_conn
)


def test_immutable_trade_plan_direct_update_rejection_hard_failure():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    trade_id = str(uuid.uuid4())
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"

    try:
        # Create initial trade plan
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.recommended_trades (
                    id, symbol, direction, entry_price, tp1, tp2, sl, timeframe, status
                ) VALUES (%s, %s, 'BUY', 100.0, 110.0, 120.0, 95.0, '1d', 'ACTIVE');
            """, (trade_id, test_symbol))

        # Attempt direct UPDATE of stop loss (sl) -> MUST RAISE TradePlanImmutableError
        with pytest.raises(TradePlanImmutableError) as exc_info:
            update_trade_plan(trade_id, {"sl": 98.0}, conn=conn)

        assert "TRADE_PLAN_IMMUTABLE" in str(exc_info.value)

        # Attempt direct UPDATE of entry_price -> MUST RAISE TradePlanImmutableError
        with pytest.raises(TradePlanImmutableError) as exc_info:
            update_trade_plan(trade_id, {"entry_price": 105.0}, conn=conn)

        assert "TRADE_PLAN_IMMUTABLE" in str(exc_info.value)

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.recommended_trades WHERE id = %s;", (trade_id,))
        conn.close()


def test_immutable_trade_plan_allows_execution_status_updates():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    trade_id = str(uuid.uuid4())
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"

    try:
        # Create initial trade plan
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.recommended_trades (
                    id, symbol, direction, entry_price, tp1, tp2, sl, timeframe, status
                ) VALUES (%s, %s, 'BUY', 100.0, 110.0, 120.0, 95.0, '1d', 'ACTIVE');
            """, (trade_id, test_symbol))

        # Update execution exit fields (allowed)
        res = update_trade_plan(trade_id, {
            "status": "CLOSED",
            "exit_reason": "TP1_REACHED",
            "exit_price": 110.0,
            "pnl_percent": 10.0
        }, conn=conn)

        assert res["status"] == "CLOSED"
        assert float(res["exit_price"]) == 110.0

        # Verify entry bounds stayed 100% unchanged
        assert float(res["entry_price"]) == 100.0
        assert float(res["sl"]) == 95.0

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.recommended_trades WHERE id = %s;", (trade_id,))
        conn.close()


def test_immutable_trade_plan_strategy_revision_creates_new_version():
    if not DATABASE_URL:
        pytest.skip("DATABASE_URL not configured")

    conn = get_db_conn()
    parent_id = str(uuid.uuid4())
    test_symbol = f"TEST_{uuid.uuid4().hex[:4].upper()}"

    try:
        # Create initial trade plan (Rev #1)
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO public.recommended_trades (
                    id, symbol, direction, entry_price, tp1, tp2, sl, timeframe, status
                ) VALUES (%s, %s, 'BUY', 100.0, 110.0, 120.0, 95.0, '1d', 'ACTIVE');
            """, (parent_id, test_symbol))

        # Execute Strategy Revision
        revised = revise_trade_plan(
            parent_trade_id=parent_id,
            new_entry_price=102.0,
            new_tp1=115.0,
            new_tp2=125.0,
            new_sl=97.0,
            invalidation_reason="TRAILING_STOP_REVISED",
            conn=conn
        )

        child_id = revised["id"]

        # Verify child trade plan
        assert revised["status"] == "ACTIVE"
        assert float(revised["entry_price"]) == 102.0
        assert float(revised["sl"]) == 97.0
        assert revised["revision_number"] == 2
        assert str(revised["parent_trade_id"]) == parent_id

        # Verify parent trade plan is marked INVALIDATED
        parent_after = get_trade_plan(parent_id, conn=conn)
        assert parent_after["status"] == "INVALIDATED"
        assert parent_after["invalidation_reason"] == "TRAILING_STOP_REVISED"
        assert float(parent_after["entry_price"]) == 100.0 # Original entry price untouched!

    finally:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM public.recommended_trades WHERE symbol = %s;", (test_symbol,))
        conn.close()
