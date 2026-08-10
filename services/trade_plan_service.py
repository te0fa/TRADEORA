"""
services/trade_plan_service.py — Immutable Trade/Signal Plans Service
=======================================================================
Enforces strict immutability of Trade Plan entry bounds (entry_price, tp1, tp2, sl, recommended_at, direction).

Policy:
1. Any direct attempt to UPDATE entry bounds on an active trade raises TradePlanImmutableError (Hard Failure).
2. Strategy updates create a NEW trade revision record (revision_number + 1) linked via parent_trade_id.
3. The prior trade plan is marked status='INVALIDATED' with an explicit invalidation_reason.
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

logger = logging.getLogger("tradeora.trade_plan")

DATABASE_URL = os.getenv('DATABASE_URL')


class TradePlanImmutableError(Exception):
    """Raised when an illegal attempt is made to update historical trade plan entry bounds directly."""
    pass


def get_db_conn():
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None


def get_trade_plan(trade_id: str, conn=None) -> Optional[Dict[str, Any]]:
    """Retrieves a single trade plan by ID."""
    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        return None

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT * FROM public.recommended_trades WHERE id = %s;", (trade_id,))
            row = cur.fetchone()
            if not row:
                return None
            res = dict(row)
            if "revision_number" not in res or res["revision_number"] is None:
                res["revision_number"] = 1
            if "parent_trade_id" not in res:
                res["parent_trade_id"] = None
            return res
    finally:
        if close_conn:
            conn.close()


def update_trade_plan(
    trade_id: str,
    updates: Dict[str, Any],
    conn=None
) -> Dict[str, Any]:
    """
    Enforces Immutability Guard:
    Guards against direct modification of entry_price, tp1, tp2, sl, direction, recommended_at.
    Allows updating execution status (status, exit_price, exit_reason, closed_at, pnl_percent).
    """
    IMMUTABLE_FIELDS = {"entry_price", "tp1", "tp2", "sl", "direction", "recommended_at"}
    
    attempted_immutable = IMMUTABLE_FIELDS.intersection(updates.keys())
    
    if attempted_immutable:
        existing = get_trade_plan(trade_id, conn=conn)
        if existing:
            for field in attempted_immutable:
                if updates[field] is not None and str(updates[field]) != str(existing.get(field)):
                    raise TradePlanImmutableError(
                        f"TRADE_PLAN_IMMUTABLE: Direct modification of historical field '{field}' "
                        f"(from {existing.get(field)} to {updates[field]}) on trade {trade_id} is strictly prohibited. "
                        f"Create a new trade revision via revise_trade_plan() instead."
                    )

    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        raise RuntimeError("Database connection unavailable")

    try:
        set_clauses = []
        params = []
        for k, v in updates.items():
            set_clauses.append(f"{k} = %s")
            params.append(v)

        if not set_clauses:
            return get_trade_plan(trade_id, conn=conn)

        params.append(trade_id)
        sql = f"UPDATE public.recommended_trades SET {', '.join(set_clauses)} WHERE id = %s RETURNING *;"

        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute(sql, params)
            row = cur.fetchone()
            if not row:
                return {}
            res = dict(row)
            if "revision_number" not in res or res["revision_number"] is None:
                res["revision_number"] = 1
            if "parent_trade_id" not in res:
                res["parent_trade_id"] = None
            return res
    finally:
        if close_conn:
            conn.close()


def revise_trade_plan(
    parent_trade_id: str,
    new_entry_price: float,
    new_tp1: float,
    new_tp2: float,
    new_sl: float,
    invalidation_reason: str = "STRATEGY_REVISED",
    conn=None
) -> Dict[str, Any]:
    """
    Creates a new trade revision (revision_number = parent + 1) and invalidates old trade.
    """
    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        raise RuntimeError("Database connection unavailable")

    try:
        parent = get_trade_plan(parent_trade_id, conn=conn)
        if not parent:
            raise ValueError(f"Parent trade {parent_trade_id} not found")

        # 1. Invalidate parent trade
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE public.recommended_trades
                SET status = 'INVALIDATED', invalidation_reason = %s
                WHERE id = %s;
            """, (invalidation_reason, parent_trade_id))

        # 2. Insert new revision trade plan
        new_id = str(uuid.uuid4())
        new_revision = (parent.get("revision_number") or 1) + 1
        now = datetime.now(timezone.utc)

        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                INSERT INTO public.recommended_trades (
                    id, company_id, symbol, direction, entry_price, tp1, tp2, sl,
                    timeframe, status, ml_probability, win_rate_hist, features_snapshot,
                    recommended_at, flow_signal, classification
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, 'ACTIVE', %s, %s, %s,
                    %s, %s, %s
                ) RETURNING *;
            """, (
                new_id, parent.get("company_id"), parent.get("symbol"), parent.get("direction"),
                new_entry_price, new_tp1, new_tp2, new_sl,
                parent.get("timeframe", "1d"), parent.get("ml_probability"),
                parent.get("win_rate_hist"), parent.get("features_snapshot"),
                now, parent.get("flow_signal"), parent.get("classification")
            ))
            new_trade = dict(cur.fetchone())
            new_trade["revision_number"] = new_revision
            new_trade["parent_trade_id"] = parent_trade_id

        logger.info(f"REVISED Trade {parent_trade_id} -> New Revision {new_id} (Rev #{new_revision})")
        return new_trade
    finally:
        if close_conn:
            conn.close()
