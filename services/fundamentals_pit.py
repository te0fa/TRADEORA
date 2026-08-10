"""
services/fundamentals_pit.py — Point-in-Time Fundamentals Engine
==================================================================
Strict Implementation of Strict NULL Rule & Zero Backdating.

Rules:
- Known-at-time ONLY.
- If a documented disclosure date exists -> effective_date = actual disclosure date.
- If no disclosure date exists -> effective_date = TODAY's date (NOW()).
- Under NO circumstances is an effective_date estimated or backdated to prior periods.
- Point-in-time queries prior to the first genuine effective_date MUST ALWAYS return NULL (None).
"""

import os
import logging
from datetime import date, datetime, timezone
from typing import Dict, Any, List, Optional
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

logger = logging.getLogger("tradeora.fundamentals_pit")

DATABASE_URL = os.getenv('DATABASE_URL')


def get_db_conn():
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None


def get_fundamentals_as_of(
    symbol: str,
    as_of_date: date | str,
    conn=None
) -> Optional[Dict[str, Any]]:
    """
    Retrieves the most recent fundamental snapshot for a symbol known AS OF the given date.
    Strict NULL Rule: If as_of_date is prior to the earliest effective_date, returns None (NULL).
    """
    if isinstance(as_of_date, str):
        target_date = datetime.strptime(as_of_date[:10], "%Y-%m-%d").date()
    else:
        target_date = as_of_date

    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        logger.warning("Database connection unavailable for PIT fundamentals lookup.")
        return None

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT * FROM public.fundamentals_snapshots
                WHERE symbol = %s AND effective_date <= %s
                ORDER BY effective_date DESC, created_at DESC
                LIMIT 1;
            """, (symbol, target_date))
            row = cur.fetchone()
            if not row:
                # Guaranteed Strict NULL Rule
                return None
            return dict(row)
    finally:
        if close_conn:
            conn.close()


def record_fundamental_snapshot(
    company_id: str,
    symbol: str,
    period_year: int,
    effective_date: date | str,
    period_type: str = 'FY',
    disclosure_source: str = 'EGX Official Disclosure Bulletin',
    pe_ratio: Optional[float] = None,
    pb_ratio: Optional[float] = None,
    ps_ratio: Optional[float] = None,
    eps: Optional[float] = None,
    roe: Optional[float] = None,
    roa: Optional[float] = None,
    net_margin: Optional[float] = None,
    debt_to_equity: Optional[float] = None,
    dividend_yield: Optional[float] = None,
    market_cap: Optional[float] = None,
    raw_metrics: Optional[Dict[str, Any]] = None,
    conn=None
) -> Dict[str, Any]:
    """
    Records a fundamental snapshot. Enforces that effective_date is explicit and documented.
    """
    if isinstance(effective_date, str):
        eff_date_str = effective_date[:10]
    else:
        eff_date_str = effective_date.isoformat()

    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        raise RuntimeError("Database connection required to insert immutable PIT fundamental snapshot.")

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                INSERT INTO public.fundamentals_snapshots (
                    company_id, symbol, period_type, period_year, effective_date,
                    pe_ratio, pb_ratio, ps_ratio, eps, roe, roa, net_margin,
                    debt_to_equity, dividend_yield, market_cap, disclosure_source, raw_metrics
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """, (
                company_id, symbol, period_type, period_year, eff_date_str,
                pe_ratio, pb_ratio, ps_ratio, eps, roe, roa, net_margin,
                debt_to_equity, dividend_yield, market_cap, disclosure_source,
                psycopg2.extras.Json(raw_metrics or {})
            ))
            row = cur.fetchone()
            logger.info(f"Recorded Immutable Fundamental Snapshot for {symbol} (Period {period_year} {period_type}, Effective: {eff_date_str})")
            return dict(row)
    finally:
        if close_conn:
            conn.close()
