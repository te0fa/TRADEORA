"""
golden_candle_audit.py
══════════════════════════════════════════════════════════════════════════════
Tradeora — Market Data Forensic Audit — Phase 4 & 4.5
الهدف: مقارنة بيانات الشموع بين ثلاثة مصادر لقياس حجم التباين الفعلي.

المصادر:
  A) market_prices   — Supabase (كل المصادر)
  B) intraday_snapshots — Supabase (tradingview_* فقط)
  C) Yahoo Finance v8  — مباشر (لا تعديل، لا cache)

القيود:
  - للقراءة فقط. لا يعدل أي بيانات.
  - معدّل الطلبات على Yahoo: ثانية واحدة بين الأسهم.
  - يعمل بـ: python scripts/golden_candle_audit.py [--symbols SYM1 SYM2 ...]

الإخراج:
  logs/golden_candle_audit_{timestamp}.json
  logs/golden_candle_audit_{timestamp}.txt
══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import time
import logging
import argparse
import textwrap
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests
import pytz
from dotenv import load_dotenv
from supabase import create_client, Client

# ── Bootstrap ─────────────────────────────────────────────────────────────────
# Support running from repo root OR from scripts/ directly
_script_dir = Path(__file__).parent.resolve()
_repo_root  = _script_dir.parent

# Load .env from repo root
load_dotenv(dotenv_path=_repo_root / ".env")

# Ensure repo root is importable (not required here but mirrors project convention)
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

# ── Logging setup ─────────────────────────────────────────────────────────────
log_dir = _repo_root / "logs"
log_dir.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("golden_candle_audit")

# ── Constants ─────────────────────────────────────────────────────────────────
DEFAULT_SYMBOLS = ["COMI", "TMGH", "FWRY", "SWDY", "EAST"]
DAILY_LIMIT     = 30        # عدد الشموع اليومية لكل سهم
YAHOO_SLEEP     = 1.0       # ثانية بين طلبات Yahoo
CLOSE_DIFF_PCT  = 1.0       # عتبة الفرق المقبول في الإغلاق (%)
CAIRO_TZ        = pytz.timezone("Africa/Cairo")

YAHOO_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
}


# ══════════════════════════════════════════════════════════════════════════════
# 1. Supabase connection
# ══════════════════════════════════════════════════════════════════════════════
def get_supabase() -> Client:
    url = (
        os.getenv("SUPABASE_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    )
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not url or not key:
        logger.critical(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY غير موجودتان في .env"
        )
        sys.exit(1)
    return create_client(url, key)


# ══════════════════════════════════════════════════════════════════════════════
# 2. Fetch company_id
# ══════════════════════════════════════════════════════════════════════════════
def get_company_id(sb: Client, symbol: str) -> Optional[str]:
    res = (
        sb.table("companies")
        .select("id")
        .ilike("symbol", symbol.strip())
        .maybe_single()
        .execute()
    )
    if res.data:
        return res.data["id"]
    logger.warning(f"[{symbol}] company not found in DB — skipping.")
    return None


# ══════════════════════════════════════════════════════════════════════════════
# 3. Source A — market_prices (all sources, last N days)
# ══════════════════════════════════════════════════════════════════════════════
def fetch_market_prices(sb: Client, company_id: str, symbol: str) -> list[dict]:
    """آخر DAILY_LIMIT شمعة يومية من market_prices، كل المصادر."""
    res = (
        sb.table("market_prices")
        .select(
            "price_date, open_price, high_price, low_price, "
            "close_price, volume, source"
        )
        .eq("company_id", company_id)
        .order("price_date", desc=True)
        .limit(DAILY_LIMIT * 6)          # نجلب أكثر لأن قد يكون لكل يوم أكثر من صف
        .execute()
    )
    rows = res.data or []

    # نأخذ أحسن مصدر لكل يوم (أولوية: egx_bulletin > tradingview > intraday_consensus > أي)
    priority = {
        "egx_bulletin":      0,
        "tradingview":       1,
        "tradingview_1d":    2,
        "intraday_consensus":3,
    }

    date_map: dict[str, dict] = {}
    for r in rows:
        date_str = str(r["price_date"])[:10]
        src      = r.get("source", "unknown")
        rank     = priority.get(src, 99)
        if date_str not in date_map or rank < priority.get(date_map[date_str]["source"], 99):
            date_map[date_str] = r

    # أحدث DAILY_LIMIT يوم
    sorted_dates = sorted(date_map.keys(), reverse=True)[:DAILY_LIMIT]
    result = [date_map[d] for d in sorted_dates]
    logger.info(f"[{symbol}] market_prices → {len(result)} rows (من {len(rows)} إجمالاً)")
    return result


# ══════════════════════════════════════════════════════════════════════════════
# 4. Source B — intraday_snapshots (tradingview_1d or daily aggregation)
# ══════════════════════════════════════════════════════════════════════════════
def fetch_intraday_snapshots(sb: Client, company_id: str, symbol: str) -> list[dict]:
    """شموع tradingview_1d من intraday_snapshots."""
    res = (
        sb.table("intraday_snapshots")
        .select(
            "snapshot_time, open_price, high_price, low_price, price, volume, source"
        )
        .eq("company_id", company_id)
        .like("source", "tradingview_%")
        .order("snapshot_time", desc=True)
        .limit(DAILY_LIMIT * 8)
        .execute()
    )
    rows = res.data or []

    # نفضّل tradingview_1d — نجمّع كل المصادر ونأخذ أفضل شمعة يومية
    date_map: dict[str, dict] = {}
    for r in rows:
        ts  = r.get("snapshot_time", "")
        date_str = str(ts)[:10]
        src = r.get("source", "")

        # أولوية tradingview_1d > tradingview_4h > tradingview_1h > ...
        pref = {"tradingview_1d": 0, "tradingview_4h": 1, "tradingview_1h": 2,
                "tradingview_30m": 3, "tradingview_15m": 4}
        rank = pref.get(src, 99)

        if date_str not in date_map or rank < pref.get(date_map[date_str]["source"], 99):
            date_map[date_str] = r

    sorted_dates = sorted(date_map.keys(), reverse=True)[:DAILY_LIMIT]
    result = [date_map[d] for d in sorted_dates]

    # نوحّد اسم الحقول لتطابق market_prices
    normalized = []
    for r in result:
        normalized.append({
            "price_date":  str(r.get("snapshot_time", ""))[:10],
            "open_price":  r.get("open_price"),
            "high_price":  r.get("high_price"),
            "low_price":   r.get("low_price"),
            "close_price": r.get("price"),            # حقل الإغلاق في intraday_snapshots
            "volume":      r.get("volume"),
            "source":      r.get("source"),
        })

    logger.info(f"[{symbol}] intraday_snapshots → {len(normalized)} rows")
    return normalized


# ══════════════════════════════════════════════════════════════════════════════
# 5. Source C — Yahoo Finance v8 API
# ══════════════════════════════════════════════════════════════════════════════
def fetch_yahoo_candles(symbol: str) -> list[dict]:
    """
    يجلب آخر 30 شمعة يومية من Yahoo Finance مباشرةً.
    يجرّب: {symbol}.CA → {symbol} (fallback).
    يُعيد القيم RAW بدون adjclose.
    """
    candidates = [f"{symbol}.CA", f"{symbol}.CAI", symbol]
    url_base   = "https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    params     = {"interval": "1d", "range": "60d", "events": "div,splits"}

    for ticker in candidates:
        url = url_base.format(ticker=ticker)
        try:
            resp = requests.get(url, headers=YAHOO_HEADERS, params=params, timeout=15)
            if resp.status_code == 429:
                logger.warning(f"[{symbol}] Yahoo 429 — sleep 5s ثم retry")
                time.sleep(5)
                resp = requests.get(url, headers=YAHOO_HEADERS, params=params, timeout=15)

            if not resp.ok:
                logger.debug(f"[{symbol}] Yahoo {ticker} → HTTP {resp.status_code}")
                continue

            data   = resp.json()
            result = data.get("chart", {}).get("result")
            if not result or not result[0].get("timestamp"):
                logger.debug(f"[{symbol}] Yahoo {ticker} → no timestamps")
                continue

            r          = result[0]
            timestamps = r["timestamp"]
            quotes     = r.get("indicators", {}).get("quote", [{}])[0]
            # نأخذ raw OHLCV (لا adjclose)
            opens   = quotes.get("open",   [])
            highs   = quotes.get("high",   [])
            lows    = quotes.get("low",    [])
            closes  = quotes.get("close",  [])
            volumes = quotes.get("volume", [])

            candles = []
            for i, ts in enumerate(timestamps):
                cl = closes[i]  if i < len(closes)  else None
                op = opens[i]   if i < len(opens)   else None
                hi = highs[i]   if i < len(highs)   else None
                lo = lows[i]    if i < len(lows)    else None
                vo = volumes[i] if i < len(volumes) else None

                if cl is None or op is None:
                    continue

                dt = datetime.fromtimestamp(ts, tz=pytz.utc).astimezone(CAIRO_TZ)
                candles.append({
                    "price_date":  dt.strftime("%Y-%m-%d"),
                    "open_price":  float(op),
                    "high_price":  float(hi) if hi is not None else float(cl),
                    "low_price":   float(lo) if lo is not None else float(cl),
                    "close_price": float(cl),
                    "volume":      int(vo)   if vo is not None else 0,
                    "source":      f"yahoo_raw ({ticker})",
                })

            # أحدث DAILY_LIMIT شمعة
            candles = sorted(candles, key=lambda x: x["price_date"], reverse=True)
            candles = candles[:DAILY_LIMIT]

            logger.info(f"[{symbol}] Yahoo ({ticker}) → {len(candles)} candles")
            return candles

        except requests.RequestException as exc:
            logger.warning(f"[{symbol}] Yahoo request error ({ticker}): {exc}")

    logger.warning(f"[{symbol}] Yahoo → لا توجد بيانات بعد تجربة كل الـ tickers")
    return []


# ══════════════════════════════════════════════════════════════════════════════
# 6. Analysis helpers
# ══════════════════════════════════════════════════════════════════════════════
def _safe_float(v) -> Optional[float]:
    try:
        return float(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def _safe_int(v) -> Optional[int]:
    try:
        return int(v) if v is not None else None
    except (TypeError, ValueError):
        return None


def is_flat_candle(row: dict) -> bool:
    """True إذا كان H = L = C (شمعة مسطحة بدون حركة حقيقية)."""
    o = _safe_float(row.get("open_price"))
    h = _safe_float(row.get("high_price"))
    l = _safe_float(row.get("low_price"))
    c = _safe_float(row.get("close_price"))
    if None in (o, h, l, c):
        return False
    return h == l == c


def is_zero_volume(row: dict) -> bool:
    v = _safe_int(row.get("volume"))
    return v is not None and v == 0


def pct_diff(a: Optional[float], b: Optional[float]) -> Optional[float]:
    """نسبة الفرق المطلق %."""
    if a is None or b is None or b == 0:
        return None
    return abs(a - b) / abs(b) * 100


def abs_diff(a: Optional[float], b: Optional[float]) -> Optional[float]:
    if a is None or b is None:
        return None
    return abs(a - b)


def analyze_candle_quality(rows: list[dict], label: str, symbol: str) -> dict:
    """تحليل جودة مجموعة شموع."""
    total     = len(rows)
    flat      = sum(1 for r in rows if is_flat_candle(r))
    zero_vol  = sum(1 for r in rows if is_zero_volume(r))
    null_close = sum(1 for r in rows if _safe_float(r.get("close_price")) is None)

    # عدد الصفوف السليمة (غير مسطحة، غير صفرية الحجم، لها إغلاق)
    healthy = total - flat - zero_vol - null_close
    healthy = max(healthy, 0)

    sources = {}
    for r in rows:
        src = str(r.get("source", "unknown"))
        sources[src] = sources.get(src, 0) + 1

    return {
        "label":      label,
        "symbol":     symbol,
        "total":      total,
        "flat":       flat,
        "zero_vol":   zero_vol,
        "null_close": null_close,
        "healthy":    healthy,
        "sources":    sources,
        "flat_pct":   round(flat / total * 100, 1)    if total else 0,
        "zvol_pct":   round(zero_vol / total * 100, 1) if total else 0,
    }


def compare_sources(
    rows_a: list[dict],
    rows_b: list[dict],
    label_a: str,
    label_b: str,
    symbol: str,
) -> dict:
    """
    تقارن مصدرين بمحاذاة على price_date.
    تُعيد ملخص الفروقات + قائمة بأكبر الانحرافات في close_price.
    """
    map_a = {str(r["price_date"])[:10]: r for r in rows_a}
    map_b = {str(r["price_date"])[:10]: r for r in rows_b}
    common_dates = sorted(set(map_a) & set(map_b), reverse=True)

    fields          = ["open_price", "high_price", "low_price", "close_price", "volume"]
    total_abs_diff  = {f: [] for f in fields}
    close_deviant   = 0   # شموع close_diff > 1%
    deviations      = []  # لاستخراج أكبر 5

    for date in common_dates:
        ra = map_a[date]
        rb = map_b[date]

        for f in fields:
            va = _safe_float(ra.get(f))
            vb = _safe_float(rb.get(f))
            d  = abs_diff(va, vb)
            if d is not None:
                total_abs_diff[f].append(d)

        ca = _safe_float(ra.get("close_price"))
        cb = _safe_float(rb.get("close_price"))
        pd = pct_diff(ca, cb)

        if pd is not None and pd > CLOSE_DIFF_PCT:
            close_deviant += 1

        if pd is not None:
            deviations.append({
                "date":       date,
                "symbol":     symbol,
                f"{label_a}_close": ca,
                f"{label_b}_close": cb,
                "diff_pct":   round(pd, 4),
                "src_a":      ra.get("source", "?"),
                "src_b":      rb.get("source", "?"),
            })

    avg_abs = {}
    for f in fields:
        vals = total_abs_diff[f]
        avg_abs[f] = round(sum(vals) / len(vals), 6) if vals else None

    top5 = sorted(deviations, key=lambda x: x["diff_pct"], reverse=True)[:5]

    return {
        "comparison":       f"{label_a}_vs_{label_b}",
        "symbol":           symbol,
        "common_dates":     len(common_dates),
        "close_deviant":    close_deviant,
        "close_deviant_pct": round(close_deviant / len(common_dates) * 100, 1) if common_dates else 0,
        "avg_abs_diff":     avg_abs,
        "top5_deviations":  top5,
    }


# ══════════════════════════════════════════════════════════════════════════════
# 7. Report formatting
# ══════════════════════════════════════════════════════════════════════════════
LINE = "─" * 72

def fmt_sources(sources: dict) -> str:
    return "  " + ", ".join(f"{s}: {n}" for s, n in sources.items())


def render_quality_block(q: dict) -> str:
    lines = [
        f"  Total candles  : {q['total']}",
        f"  Healthy        : {q['healthy']}",
        f"  Flat (H=L=C)   : {q['flat']}  ({q['flat_pct']}%)",
        f"  Zero volume    : {q['zero_vol']}  ({q['zvol_pct']}%)",
        f"  Null close     : {q['null_close']}",
        f"  Sources        :",
        fmt_sources(q["sources"]),
    ]
    return "\n".join(lines)


def render_comparison_block(c: dict) -> str:
    comp = c["comparison"].replace("_", " ")
    avg  = c["avg_abs_diff"]
    lines = [
        f"  Common dates   : {c['common_dates']}",
        f"  Close diff >1% : {c['close_deviant']} ({c['close_deviant_pct']}%)",
        f"  Avg abs diff   :",
        f"    Open   : {avg.get('open_price')}",
        f"    High   : {avg.get('high_price')}",
        f"    Low    : {avg.get('low_price')}",
        f"    Close  : {avg.get('close_price')}",
        f"    Volume : {avg.get('volume')}",
    ]
    if c["top5_deviations"]:
        lines.append(f"  Top deviations in close_price :")
        for d in c["top5_deviations"]:
            a_key = [k for k in d if k.endswith("_close") and not k.startswith("src")][0]
            b_key = [k for k in d if k.endswith("_close") and k != a_key][0]
            lines.append(
                f"    {d['date']}  {d['symbol']:6s}  "
                f"A={d[a_key]}  B={d[b_key]}  "
                f"Δ={d['diff_pct']}%"
            )
    return "\n".join(lines)


def build_text_report(results: dict, timestamp_str: str) -> str:
    lines = [
        "═" * 72,
        " TRADEORA — GOLDEN CANDLE AUDIT REPORT",
        f" Generated : {timestamp_str}",
        f" Symbols   : {', '.join(results['config']['symbols'])}",
        f" Period    : Last {DAILY_LIMIT} daily candles per symbol",
        "═" * 72,
        "",
    ]

    # ── Global summary ──────────────────────────────────────────────────────
    g = results["global_summary"]
    lines += [
        "┌─ GLOBAL SUMMARY " + "─" * 54,
        f"│  Total symbols    : {g['total_symbols']}",
        f"│  Symbols with data: {g['symbols_with_data']}",
        f"│  Total candles (A): {g['total_candles_A']}",
        f"│  Flat candles  (A): {g['total_flat_A']}  ({g['flat_pct_A']}%)",
        f"│  Zero volume   (A): {g['total_zvol_A']}  ({g['zvol_pct_A']}%)",
        f"│  Close diff>1% (A vs C Yahoo): {g['total_deviant_AC']}",
        f"│  Top global source breakdown  :",
    ]
    for src, cnt in g["source_totals"].items():
        lines.append(f"│    {src}: {cnt}")
    lines += [
        "└" + "─" * 71,
        "",
    ]

    # ── Per-symbol ──────────────────────────────────────────────────────────
    for sym_data in results["symbols"]:
        sym = sym_data["symbol"]
        lines += [
            LINE,
            f"  SYMBOL: {sym}",
            LINE,
        ]

        # Quality A
        if sym_data.get("quality_A"):
            lines.append(f"\n  [A] market_prices (best-source per day)")
            lines.append(render_quality_block(sym_data["quality_A"]))

        # Quality B
        if sym_data.get("quality_B"):
            lines.append(f"\n  [B] intraday_snapshots (tradingview_*)")
            lines.append(render_quality_block(sym_data["quality_B"]))

        # Quality C
        if sym_data.get("quality_C"):
            lines.append(f"\n  [C] Yahoo Finance (raw, no adjclose)")
            lines.append(render_quality_block(sym_data["quality_C"]))

        # Comparisons
        for comp in sym_data.get("comparisons", []):
            lines.append(f"\n  ▶ Comparison: {comp['comparison'].replace('_', ' ')}")
            lines.append(render_comparison_block(comp))

        lines.append("")

    # ── Global top-5 deviations ─────────────────────────────────────────────
    lines += [
        LINE,
        "  TOP-5 GLOBAL CLOSE_PRICE DEVIATIONS (A vs C)",
        LINE,
    ]
    top5 = results["global_summary"].get("top5_global_AC", [])
    if top5:
        lines.append(
            f"  {'Date':12s}  {'Symbol':6s}  {'A_close':>12s}  {'C_close':>12s}  {'Δ%':>8s}  Source_A"
        )
        lines.append("  " + "─" * 68)
        for d in top5:
            a_key = [k for k in d if "close" in k and not k.startswith("src")][0]
            b_key = [k for k in d if "close" in k and k != a_key and not k.startswith("src")][0]
            lines.append(
                f"  {d['date']:12s}  {d['symbol']:6s}  "
                f"{str(d.get(a_key, 'N/A')):>12s}  "
                f"{str(d.get(b_key, 'N/A')):>12s}  "
                f"{d['diff_pct']:>7.2f}%  "
                f"{d.get('src_a', '?')}"
            )
    else:
        lines.append("  No common dates found between A and C for comparison.")

    lines += [
        "",
        "═" * 72,
        " END OF REPORT — Data is read-only. No modifications were made.",
        "═" * 72,
    ]

    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════════════
# 8. Main pipeline
# ══════════════════════════════════════════════════════════════════════════════
def run_audit(symbols: list[str]) -> dict:
    sb         = get_supabase()
    now_cairo  = datetime.now(CAIRO_TZ)
    ts_str     = now_cairo.strftime("%Y%m%d_%H%M%S")
    ts_human   = now_cairo.strftime("%Y-%m-%d %H:%M:%S %Z")

    results = {
        "generated_at": ts_human,
        "config":       {"symbols": symbols, "daily_limit": DAILY_LIMIT},
        "symbols":      [],
        "global_summary": {},
    }

    # Aggregates for global summary
    total_candles_A  = 0
    total_flat_A     = 0
    total_zvol_A     = 0
    total_deviant_AC = 0
    source_totals: dict[str, int] = {}
    all_deviations_AC: list[dict] = []

    symbols_with_data = 0

    for idx, symbol in enumerate(symbols):
        symbol = symbol.upper().strip()
        logger.info(f"\n{'═'*60}")
        logger.info(f"Processing {idx+1}/{len(symbols)}: {symbol}")

        sym_result: dict = {"symbol": symbol}

        # ── Company ID ──────────────────────────────────────────────────────
        company_id = get_company_id(sb, symbol)
        sym_result["company_id"] = company_id

        if not company_id:
            sym_result["error"] = "company not found"
            results["symbols"].append(sym_result)
            continue

        symbols_with_data += 1

        # ── Source A: market_prices ─────────────────────────────────────────
        rows_A = fetch_market_prices(sb, company_id, symbol)
        qa     = analyze_candle_quality(rows_A, "market_prices", symbol)
        sym_result["quality_A"]     = qa
        sym_result["raw_A"]         = rows_A

        total_candles_A += qa["total"]
        total_flat_A    += qa["flat"]
        total_zvol_A    += qa["zero_vol"]
        for src, cnt in qa["sources"].items():
            source_totals[src] = source_totals.get(src, 0) + cnt

        # ── Source B: intraday_snapshots (tradingview) ──────────────────────
        rows_B = fetch_intraday_snapshots(sb, company_id, symbol)
        qb     = analyze_candle_quality(rows_B, "intraday_snapshots_tv", symbol)
        sym_result["quality_B"] = qb
        sym_result["raw_B"]     = rows_B

        # ── Source C: Yahoo Finance (raw) ───────────────────────────────────
        logger.info(f"[{symbol}] Fetching Yahoo Finance data …")
        rows_C = fetch_yahoo_candles(symbol)
        qc     = analyze_candle_quality(rows_C, "yahoo_raw", symbol)
        sym_result["quality_C"] = qc
        sym_result["raw_C"]     = rows_C

        if idx < len(symbols) - 1:
            time.sleep(YAHOO_SLEEP)

        # ── Comparisons ─────────────────────────────────────────────────────
        comparisons = []

        if rows_A and rows_B:
            comp_AB = compare_sources(rows_A, rows_B, "A", "B", symbol)
            comparisons.append(comp_AB)

        if rows_A and rows_C:
            comp_AC = compare_sources(rows_A, rows_C, "A", "C", symbol)
            comparisons.append(comp_AC)
            total_deviant_AC        += comp_AC["close_deviant"]
            all_deviations_AC       += comp_AC["top5_deviations"]

        if rows_B and rows_C:
            comp_BC = compare_sources(rows_B, rows_C, "B", "C", symbol)
            comparisons.append(comp_BC)

        sym_result["comparisons"] = comparisons
        results["symbols"].append(sym_result)

    # ── Global summary ───────────────────────────────────────────────────────
    top5_global_AC = sorted(
        all_deviations_AC, key=lambda x: x["diff_pct"], reverse=True
    )[:5]

    flat_pct_A = round(total_flat_A / total_candles_A * 100, 1) if total_candles_A else 0
    zvol_pct_A = round(total_zvol_A / total_candles_A * 100, 1) if total_candles_A else 0

    results["global_summary"] = {
        "total_symbols":    len(symbols),
        "symbols_with_data": symbols_with_data,
        "total_candles_A":  total_candles_A,
        "total_flat_A":     total_flat_A,
        "flat_pct_A":       flat_pct_A,
        "total_zvol_A":     total_zvol_A,
        "zvol_pct_A":       zvol_pct_A,
        "total_deviant_AC": total_deviant_AC,
        "source_totals":    source_totals,
        "top5_global_AC":   top5_global_AC,
    }

    # ── Save outputs ─────────────────────────────────────────────────────────
    json_path = log_dir / f"golden_candle_audit_{ts_str}.json"
    txt_path  = log_dir / f"golden_candle_audit_{ts_str}.txt"

    # JSON — remove raw rows to keep file manageable; keep full raw optionally
    json_output = {k: v for k, v in results.items() if k != "symbols"}
    json_output["symbols"] = []
    for sym_data in results["symbols"]:
        sym_clean = {k: v for k, v in sym_data.items() if k not in ("raw_A", "raw_B", "raw_C")}
        json_output["symbols"].append(sym_clean)

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_output, f, ensure_ascii=False, indent=2)

    text_report = build_text_report(results, ts_human)
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(text_report)

    logger.info(f"\n✅ JSON report saved → {json_path}")
    logger.info(f"✅ TXT  report saved → {txt_path}")

    # Print text report to stdout as well
    print("\n")
    print(text_report)

    return results


# ══════════════════════════════════════════════════════════════════════════════
# 9. Entry point
# ══════════════════════════════════════════════════════════════════════════════
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Golden Candle Audit — Tradeora data integrity check",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=textwrap.dedent("""\
        أمثلة:
          python scripts/golden_candle_audit.py
          python scripts/golden_candle_audit.py --symbols COMI TMGH EAST
        """),
    )
    parser.add_argument(
        "--symbols",
        nargs="+",
        default=DEFAULT_SYMBOLS,
        metavar="SYM",
        help=f"رموز الأسهم (default: {' '.join(DEFAULT_SYMBOLS)})",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    logger.info(f"Golden Candle Audit — بدء التشغيل")
    logger.info(f"Symbols: {args.symbols}")
    logger.info(f"Log dir: {log_dir}")
    run_audit(symbols=args.symbols)
