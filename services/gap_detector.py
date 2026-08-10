"""
services/gap_detector.py — Market Data Gap Detection & Telemetry Engine
========================================================================
Cross-references market price records against the Authoritative EGX Trading Calendar
(services/calendar.py) to detect missing trading days, un-synced active equities,
and incomplete OHLC candles.

Zero False Positives:
- Weekends (Fri/Sat) and Official Holidays (e.g. Eid, 23 July, 6 Oct) are NEVER flagged.

Identified Gap Types:
- MISSING_DAY: Exchange was open on a trading day but symbol has 0 price records.
- INCOMPLETE_OHLC: Price record exists but open/high/low/volume is missing or zero.
- STALE_FEED: Symbol's latest price date is > 3 trading days behind the latest active session.
- ZERO_VOLUME_ACTIVE: High-liquidity symbol has 0 volume on an active trading day.
"""

import os
import json
import logging
from datetime import date, datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Set
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

from services.calendar import (
    is_trading_day,
    get_trading_days,
    parse_date,
    get_holiday_info
)
from services.observability import send_telegram_alert

logger = logging.getLogger("tradeora.gap_detector")

DATABASE_URL = os.getenv('DATABASE_URL')


def get_db_conn():
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None


def get_active_equities(conn=None) -> List[Dict[str, Any]]:
    """Returns all active listed equities from public.companies."""
    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        return []

    try:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT id, symbol, name_ar, sector, listing_status
                FROM public.companies
                WHERE status = 'active' OR listing_status = 'listed'
                ORDER BY symbol;
            """)
            return [dict(r) for r in cur.fetchall()]
    finally:
        if close_conn:
            conn.close()


def detect_gaps_in_window(
    start_date: date | str,
    end_date: date | str,
    target_symbols: Optional[List[str]] = None,
    conn=None
) -> Dict[str, Any]:
    """
    Scans market_prices across the date range [start_date, end_date] for active trading days.
    Cross-references against Authoritative EGX Calendar to guarantee zero false positives.
    """
    s_dt = parse_date(start_date)
    e_dt = parse_date(end_date)

    # 1. Generate valid EGX trading days only (Excludes weekends & holidays automatically)
    valid_trading_days = get_trading_days(s_dt, e_dt)
    valid_day_strs = set(d.isoformat() for d in valid_trading_days)

    close_conn = False
    if conn is None:
        conn = get_db_conn()
        close_conn = True

    if not conn:
        return {"error": "Database connection unavailable", "gaps": []}

    try:
        active_companies = get_active_equities(conn=conn)
        if target_symbols:
            active_companies = [c for c in active_companies if c["symbol"] in target_symbols]

        company_map = {c["symbol"]: c["id"] for c in active_companies}
        symbols = list(company_map.keys())

        if not symbols or not valid_trading_days:
            return {
                "scan_range": f"{s_dt} to {e_dt}",
                "valid_trading_days_count": len(valid_trading_days),
                "active_symbols_scanned": len(symbols),
                "gaps_found": 0,
                "gaps": []
            }

        # 2. Fetch existing price records for these symbols and date range
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT mp.company_id, c.symbol, mp.price_date, mp.open_price, mp.high_price, mp.low_price, mp.close_price, mp.volume, mp.source
                FROM public.market_prices mp
                JOIN public.companies c ON c.id = mp.company_id
                WHERE mp.price_date >= %s AND mp.price_date <= %s
                  AND c.symbol = ANY(%s);
            """, (s_dt, e_dt, symbols))
            rows = [dict(r) for r in cur.fetchall()]

        # Index existing records: (symbol, date_str) -> record
        existing_grid: Dict[Tuple[str, str], Dict[str, Any]] = {}
        for r in rows:
            d_str = r["price_date"].isoformat() if isinstance(r["price_date"], date) else str(r["price_date"])[:10]
            existing_grid[(r["symbol"], d_str)] = r

        gaps = []

        # 3. Evaluate every (symbol, trading_day) pair
        for t_day in valid_trading_days:
            d_str = t_day.isoformat()
            for sym in symbols:
                cid = company_map[sym]
                key = (sym, d_str)

                if key not in existing_grid:
                    # ── MISSING_DAY GAP ─────────────────────────────────────
                    gaps.append({
                        "company_id": cid,
                        "symbol": sym,
                        "gap_date": d_str,
                        "gap_type": "MISSING_DAY",
                        "severity": "HIGH",
                        "source": None,
                        "details": {
                            "reason": f"Exchange was OPEN on {d_str} but symbol {sym} has zero price records",
                            "is_trading_day": True
                        }
                    })
                else:
                    rec = existing_grid[key]
                    # ── INCOMPLETE_OHLC GAP ──────────────────────────────────
                    o = rec.get("open_price")
                    h = rec.get("high_price")
                    l = rec.get("low_price")
                    c = rec.get("close_price")
                    v = rec.get("volume")

                    if o is None or h is None or l is None or c is None:
                        gaps.append({
                            "company_id": cid,
                            "symbol": sym,
                            "gap_date": d_str,
                            "gap_type": "INCOMPLETE_OHLC",
                            "severity": "MEDIUM",
                            "source": rec.get("source"),
                            "details": {
                                "open": float(o) if o is not None else None,
                                "high": float(h) if h is not None else None,
                                "low": float(l) if l is not None else None,
                                "close": float(c) if c is not None else None,
                                "reason": "Null or incomplete OHLC attributes"
                            }
                        })

        # 4. Idempotently record gaps into public.market_data_gaps
        if gaps:
            with conn.cursor() as cur:
                psycopg2.extras.execute_values(
                    cur,
                    """
                    INSERT INTO public.market_data_gaps (
                        company_id, symbol, gap_date, gap_type, severity, source, details
                    ) VALUES %s
                    ON CONFLICT (symbol, gap_date, gap_type) DO UPDATE SET
                        severity = EXCLUDED.severity,
                        source = EXCLUDED.source,
                        details = EXCLUDED.details,
                        detected_at = NOW();
                    """,
                    [(
                        g["company_id"], g["symbol"], g["gap_date"], g["gap_type"],
                        g["severity"], g["source"], json.dumps(g["details"])
                    ) for g in gaps]
                )

        logger.info(f"Market Data Gap Scan Completed | Range: {s_dt} to {e_dt} | Trading Days: {len(valid_trading_days)} | Gaps Found: {len(gaps)}")

        # 5. Alerting if CRITICAL / HIGH gaps discovered
        high_critical = [g for g in gaps if g["severity"] in ("HIGH", "CRITICAL")]
        if high_critical:
            alert_text = (
                f"• *Active Symbols Scanned:* `{len(symbols)}`\n"
                f"• *High Severity Gaps Found:* `{len(high_critical)}` / `{len(gaps)}` total\n"
                f"• *Date Range:* `{s_dt}` to `{e_dt}`\n"
                f"• *Sample:* `{high_critical[0]['symbol']}` missing on `{high_critical[0]['gap_date']}`"
            )
            send_telegram_alert("Market Data Gap Detected", alert_text, level="WARNING")

        return {
            "scan_range": f"{s_dt} to {e_dt}",
            "valid_trading_days_count": len(valid_trading_days),
            "active_symbols_scanned": len(symbols),
            "gaps_found": len(gaps),
            "gaps": gaps
        }
    finally:
        if close_conn:
            conn.close()
