"""
services/quality_gate.py — Market Data Quality Gate & Quarantine Subsystem
==========================================================================
Post-import and pre-consumption data quality firewall for Tradeora EGX.

Evaluates every market candle / price record across 7 dimensions:
1. OHLC Internal Consistency (high >= max(open, close, low), low <= min(open, close, high), prices > 0)
2. Volume Realism (volume >= 0, negative volume is FATAL INVALID)
3. Timestamp Validity (price_date not in future, ISO format)
4. Source Whitelist & Canonical Hierarchy (must be in CANONICAL_SOURCES, never in FORBIDDEN_SOURCES)
5. Missing Mandatory Attributes (company_id/symbol and close_price required)
6. Freshness Boundary (price_date within 10-day active window)
7. Price Drift & Corporate Action Awareness (Single-day drift >= 40% with known corporate action is
   CORPORATE_ACTION_RELATED; unverified drift enters SUSPICIOUS quarantine without silent rejection).

Classifications:
- VALID: Passes all gates, safe for signals, ML, charts, and accounting.
- INVALID: Fatal structural corruption (e.g., high < low, negative volume, forbidden vendor).
- SUSPICIOUS: Large price jump without confirmed corporate action -> Quarantined for audit.
- STALE: Historical date exceeding freshness threshold.
- MISSING: Missing critical identifiers or zero/null close price.
- CORPORATE_ACTION_RELATED: Validated price adjustment (stock split / dividend / rights issue).
"""

import os
import logging
from datetime import date, datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / '.env')

from services.canonical import (
    CANONICAL_SOURCES_DAILY,
    FORBIDDEN_SOURCES
)

logger = logging.getLogger("tradeora.quality_gate")

# Thresholds
DRIFT_ANOMALY_THRESHOLD = 0.40  # >= 40% single-day change warrants corporate action check
FRESHNESS_LIMIT_DAYS = 10


def parse_date_obj(d: Any) -> Optional[date]:
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, str):
        try:
            return datetime.fromisoformat(d.replace("Z", "+00:00")).date()
        except Exception:
            return None
    return None


def validate_single_record(
    record: Dict[str, Any],
    previous_close: Optional[float] = None,
    known_corporate_actions: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Validates a single market price or candle record.
    Returns:
      {
        "status": "VALID" | "INVALID" | "SUSPICIOUS" | "STALE" | "MISSING" | "CORPORATE_ACTION_RELATED",
        "is_pass": bool,
        "rejection_reason": str | None,
        "details": dict
      }
    """
    symbol = str(record.get("symbol") or record.get("company_id") or "").strip()
    source = str(record.get("source") or "").strip()
    raw_date = record.get("price_date") or record.get("date")
    
    # ── 1. Check Missing Mandatory Identifiers ───────────────────────────────
    if not symbol:
        return {
            "status": "MISSING",
            "is_pass": False,
            "rejection_reason": "Missing company identifier / symbol",
            "details": {"record": record}
        }

    p_date = parse_date_obj(raw_date)
    if not p_date:
        return {
            "status": "MISSING",
            "is_pass": False,
            "rejection_reason": f"Invalid or missing price_date: {raw_date}",
            "details": {"raw_date": raw_date}
        }

    # ── 2. Check Future Timestamp ────────────────────────────────────────────
    today = datetime.now(timezone.utc).date()
    if p_date > (today + timedelta(days=1)):  # 1 day timezone buffer
        return {
            "status": "INVALID",
            "is_pass": False,
            "rejection_reason": f"Future price date detected ({p_date} > today {today})",
            "details": {"price_date": str(p_date), "today": str(today)}
        }

    # ── 3. Check Source Vendor Whitelist / Blacklist ──────────────────────────
    if source in FORBIDDEN_SOURCES:
        return {
            "status": "INVALID",
            "is_pass": False,
            "rejection_reason": f"Forbidden data source: '{source}' is strictly prohibited",
            "details": {"source": source}
        }

    if source not in CANONICAL_SOURCES_DAILY and not source.startswith("tradingview_") and not source.startswith("yahoo_"):
        return {
            "status": "INVALID",
            "is_pass": False,
            "rejection_reason": f"Unrecognized data vendor source: '{source}'",
            "details": {"source": source}
        }

    # ── 4. Validate Prices & OHLC Geometry ───────────────────────────────────
    try:
        close_val = float(record.get("close_price") or record.get("close") or 0)
    except (ValueError, TypeError):
        return {
            "status": "MISSING",
            "is_pass": False,
            "rejection_reason": "Malformed or non-numeric close_price",
            "details": {"raw_close": record.get("close_price")}
        }

    if close_val <= 0:
        return {
            "status": "INVALID",
            "is_pass": False,
            "rejection_reason": f"Non-positive close price: {close_val}",
            "details": {"close_price": close_val}
        }

    open_val = record.get("open_price") or record.get("open")
    high_val = record.get("high_price") or record.get("high")
    low_val  = record.get("low_price") or record.get("low")

    if open_val is not None:
        try:
            open_num = float(open_val)
            if open_num <= 0:
                return {
                    "status": "INVALID",
                    "is_pass": False,
                    "rejection_reason": f"Non-positive open price: {open_num}",
                    "details": {"open_price": open_num}
                }
        except (ValueError, TypeError):
            pass

    if high_val is not None and low_val is not None:
        try:
            h_num = float(high_val)
            l_num = float(low_val)

            # High strictly less than Low is a fatal corruption
            if h_num < l_num:
                return {
                    "status": "INVALID",
                    "is_pass": False,
                    "rejection_reason": f"Geometry Violation: High ({h_num}) < Low ({l_num})",
                    "details": {"high": h_num, "low": l_num}
                }

            # High must be >= close and open (if open exists)
            min_high_bound = max(close_val, float(open_val) if open_val is not None else close_val)
            if h_num < min_high_bound:
                return {
                    "status": "INVALID",
                    "is_pass": False,
                    "rejection_reason": f"Geometry Violation: High ({h_num}) < max(Open, Close) ({min_high_bound})",
                    "details": {"high": h_num, "min_high_bound": min_high_bound}
                }

            # Low must be <= close and open (if open exists)
            max_low_bound = min(close_val, float(open_val) if open_val is not None else close_val)
            if l_num > max_low_bound:
                return {
                    "status": "INVALID",
                    "is_pass": False,
                    "rejection_reason": f"Geometry Violation: Low ({l_num}) > min(Open, Close) ({max_low_bound})",
                    "details": {"low": l_num, "max_low_bound": max_low_bound}
                }
        except (ValueError, TypeError):
            pass

    # ── 5. Volume Realism ────────────────────────────────────────────────────
    raw_vol = record.get("volume")
    if raw_vol is not None:
        try:
            vol_num = int(raw_vol)
            if vol_num < 0:
                return {
                    "status": "INVALID",
                    "is_pass": False,
                    "rejection_reason": f"Negative trading volume: {vol_num}",
                    "details": {"volume": vol_num}
                }
        except (ValueError, TypeError):
            pass

    # ── 6. Price Drift & Corporate Action Context ────────────────────────────
    if previous_close is not None and previous_close > 0:
        drift = (close_val - previous_close) / previous_close
        if abs(drift) >= DRIFT_ANOMALY_THRESHOLD:
            # Check if there is a known corporate action on or near this date
            is_confirmed_ca = False
            ca_details = None
            if known_corporate_actions:
                for ca in known_corporate_actions:
                    ca_symbol = ca.get("symbol")
                    ca_date = parse_date_obj(ca.get("event_date") or ca.get("date"))
                    if ca_symbol == symbol and ca_date and abs((p_date - ca_date).days) <= 2:
                        is_confirmed_ca = True
                        ca_details = ca
                        break

            if is_confirmed_ca:
                return {
                    "status": "CORPORATE_ACTION_RELATED",
                    "is_pass": True,
                    "rejection_reason": None,
                    "details": {
                        "drift_ratio": round(drift, 4),
                        "corporate_action": ca_details,
                        "note": "Legitimate price adjustment confirmed via Corporate Action registry"
                    }
                }
            else:
                return {
                    "status": "SUSPICIOUS",
                    "is_pass": False,
                    "rejection_reason": f"Large single-day price drift ({drift*100:.1f}%) without confirmed corporate action",
                    "details": {
                        "drift_ratio": round(drift, 4),
                        "previous_close": previous_close,
                        "close_price": close_val,
                        "note": "Quarantined for manual/automated corporate action reconciliation"
                    }
                }

    # ── 7. Freshness Boundary Check ──────────────────────────────────────────
    if (today - p_date).days > FRESHNESS_LIMIT_DAYS:
        return {
            "status": "STALE",
            "is_pass": True,  # Stale data is valid for historical archive, but marked
            "rejection_reason": None,
            "details": {"age_days": (today - p_date).days, "price_date": str(p_date)}
        }

    return {
        "status": "VALID",
        "is_pass": True,
        "rejection_reason": None,
        "details": {"price_date": str(p_date), "close_price": close_val}
    }


def validate_batch(
    records: List[Dict[str, Any]],
    previous_closes: Optional[Dict[str, float]] = None,
    known_corporate_actions: Optional[List[Dict[str, Any]]] = None
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Validates a batch of market price records.
    Returns:
      (valid_records, quarantined_records)
    """
    valid_list = []
    quarantine_list = []

    for r in records:
        sym = r.get("symbol") or r.get("company_id")
        prev_close = previous_closes.get(sym) if (previous_closes and sym) else None
        res = validate_single_record(r, previous_close=prev_close, known_corporate_actions=known_corporate_actions)

        tagged = {**r, "quality_status": res["status"], "rejection_reason": res["rejection_reason"]}

        if res["is_pass"]:
            valid_list.append(tagged)
        else:
            quarantine_list.append(tagged)

    return valid_list, quarantine_list
