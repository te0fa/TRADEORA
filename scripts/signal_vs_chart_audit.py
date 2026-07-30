"""
signal_vs_chart_audit.py
══════════════════════════════════════════════════════════════════════════════
Tradeora — Market Data Forensic Audit — Signal vs Chart Price Comparison
الهدف: مقارنة سعر الدخول (entry_price) في كل صفقة مفتوحة/معلقة (pending/active)
مع آخر سعر إغلاق مسجل في market_prices والسعر الحالي من TradingView Scanner.

الـ Script يقوم بـ:
1. جلب الصفحات الحالية من recommended_trades حيث status IN ('pending', 'active').
2. لكل صفقة، يجلب آخر سعر إغلاق من market_prices والمصدر التابع له.
3. يجلب السعر الحي الحالي مباشرة من TradingView Scanner API.
4. حساب نسبة التباين وحصر الصفقات حسب الفئات:
   - سليمة: الفرق < 1%
   - مشبوهة: الفرق 1% - 5%
   - فاسدة على الأرجح: الفرق > 5%
5. حساب تأثير كل فئة على الـ Cumulative PnL (ربح/خسارة الصفقات إذا حسُبت بالسعر الحالي).
6. طباعة تقرير منسق وحفظ المخرجات في مجلد logs/.

القيود:
  - للقراءة فقط. لا تعدل أي بيانات.
  - يعمل بـ: python scripts/signal_vs_chart_audit.py
══════════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Any

import requests
import pytz
from dotenv import load_dotenv
from supabase import create_client, Client

# ── Bootstrap ─────────────────────────────────────────────────────────────────
_script_dir = Path(__file__).parent.resolve()
_repo_root = _script_dir.parent

load_dotenv(dotenv_path=_repo_root / ".env")

if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

log_dir = _repo_root / "logs"
log_dir.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("signal_vs_chart_audit")

CAIRO_TZ = pytz.timezone("Africa/Cairo")

# ── Supabase Setup ────────────────────────────────────────────────────────────
def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not url or not key:
        logger.critical("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env")
        sys.exit(1)
    return create_client(url, key)

# ── TradingView Scanner Live Price Fetch ──────────────────────────────────────
def fetch_tv_live_prices(symbols: List[str]) -> Dict[str, float]:
    """Fetch live price for symbols directly from TradingView Scanner API."""
    if not symbols:
        return {}

    url = "https://scanner.tradingview.com/egypt/scan"
    payload = {
        "filter": [{"left": "name", "operation": "in_range", "right": symbols}],
        "symbols": {"query": {"types": []}},
        "columns": ["name", "close"],
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/json",
    }

    results = {}
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        if resp.ok:
            data = resp.json()
            for row in data.get("data", []):
                sym = row.get("d", [])[0]
                close_p = row.get("d", [])[1]
                if sym and close_p is not None:
                    results[sym.upper()] = float(close_p)
    except Exception as e:
        logger.warning(f"Error fetching TV Scanner prices: {e}")

    return results

# ── Safe Math Helpers ─────────────────────────────────────────────────────────
def calc_pct_diff(val1: float, val2: float) -> float:
    if not val2:
        return 0.0
    return abs(val1 - val2) / val2 * 100.0

def calc_pnl(direction: str, entry: float, current: float) -> float:
    if not entry or not current:
        return 0.0
    if direction.lower() == "buy":
        return ((current - entry) / entry) * 100.0
    else:  # sell / short
        return ((entry - current) / entry) * 100.0

# ── Main Audit Function ───────────────────────────────────────────────────────
def run_audit():
    sb = get_supabase()
    now_cairo = datetime.now(CAIRO_TZ)
    ts_str = now_cairo.strftime("%Y%m%d_%H%M%S")
    ts_human = now_cairo.strftime("%Y-%m-%d %H:%M:%S %Z")

    logger.info("Fetching active/pending recommendations from Supabase...")
    trades_res = (
        sb.table("recommended_trades")
        .select("id, company_id, symbol, direction, entry_price, tp1, tp2, sl, status, recommended_at")
        .in_("status", ["pending", "active"])
        .execute()
    )

    trades = trades_res.data or []
    if not trades:
        logger.info("No active or pending trades found.")
        return

    logger.info(f"Found {len(trades)} active/pending trades.")

    # Unique symbols
    symbols = list(set(t["symbol"] for t in trades if t.get("symbol")))
    tv_prices = fetch_tv_live_prices(symbols)

    audit_rows = []
    
    cat_healthy = []    # < 1%
    cat_suspicious = [] # 1% - 5%
    cat_corrupted = []  # > 5%

    for t in trades:
        trade_id = t["id"]
        symbol = t["symbol"]
        cid = t.get("company_id")
        direction = t.get("direction", "buy")
        entry_price = float(t["entry_price"]) if t.get("entry_price") is not None else 0.0

        # Fetch latest price from market_prices
        mp_res = (
            sb.table("market_prices")
            .select("close_price, price_date, source")
            .eq("company_id", cid)
            .order("price_date", desc=True)
            .limit(1)
            .execute()
        )
        
        mp_data = mp_res.data[0] if mp_res.data else {}
        db_close = float(mp_data["close_price"]) if mp_data.get("close_price") is not None else entry_price
        db_date = mp_data.get("price_date", "N/A")
        db_source = mp_data.get("source", "unknown")

        tv_close = tv_prices.get(symbol, db_close)

        # Differences
        diff_vs_db_pct = calc_pct_diff(entry_price, db_close)
        diff_vs_tv_pct = calc_pct_diff(entry_price, tv_close)

        # Current PnL based on DB close and TV live price
        pnl_db = calc_pnl(direction, entry_price, db_close)
        pnl_tv = calc_pnl(direction, entry_price, tv_close)

        row_info = {
            "trade_id": trade_id,
            "symbol": symbol,
            "direction": direction,
            "status": t.get("status"),
            "entry_price": entry_price,
            "db_close_price": db_close,
            "db_date": db_date,
            "db_source": db_source,
            "tv_live_price": tv_close,
            "diff_vs_db_pct": round(diff_vs_db_pct, 2),
            "diff_vs_tv_pct": round(diff_vs_tv_pct, 2),
            "pnl_db": round(pnl_db, 2),
            "pnl_tv": round(pnl_tv, 2),
            "recommended_at": t.get("recommended_at"),
        }

        audit_rows.append(row_info)

        if diff_vs_db_pct < 1.0:
            cat_healthy.append(row_info)
        elif 1.0 <= diff_vs_db_pct <= 5.0:
            cat_suspicious.append(row_info)
        else:
            cat_corrupted.append(row_info)

    # ── Calculate Aggregates ──────────────────────────────────────────────────
    total_trades = len(audit_rows)
    
    pnl_healthy_db = sum(r["pnl_db"] for r in cat_healthy)
    pnl_suspicious_db = sum(r["pnl_db"] for r in cat_suspicious)
    pnl_corrupted_db = sum(r["pnl_db"] for r in cat_corrupted)
    total_pnl_db = sum(r["pnl_db"] for r in audit_rows)

    pnl_healthy_tv = sum(r["pnl_tv"] for r in cat_healthy)
    pnl_suspicious_tv = sum(r["pnl_tv"] for r in cat_suspicious)
    pnl_corrupted_tv = sum(r["pnl_tv"] for r in cat_corrupted)
    total_pnl_tv = sum(r["pnl_tv"] for r in audit_rows)

    # Sort corrupted trades by diff_vs_db_pct desc
    cat_corrupted.sort(key=lambda x: x["diff_vs_db_pct"], reverse=True)

    # ── Render Text Report ────────────────────────────────────────────────────
    report_lines = [
        "═" * 85,
        " TRADEORA — SIGNAL VS CHART PRICE AUDIT REPORT",
        f" Generated  : {ts_human}",
        f" Target     : recommended_trades (status IN 'pending', 'active')",
        f" Total Trades: {total_trades}",
        "═" * 85,
        "",
        "┌─ CATEGORY SUMMARY (Entry Price vs Last Market Close) ──────────────────────────┐",
        f"│  🟢 Healthy (< 1% Diff)        : {len(cat_healthy):3d} trades ({len(cat_healthy)/total_trades*100:5.1f}%) | DB PnL: {pnl_healthy_db:+7.2f}% | TV PnL: {pnl_healthy_tv:+7.2f}%",
        f"│  🟡 Suspicious (1% - 5% Diff)  : {len(cat_suspicious):3d} trades ({len(cat_suspicious)/total_trades*100:5.1f}%) | DB PnL: {pnl_suspicious_db:+7.2f}% | TV PnL: {pnl_suspicious_tv:+7.2f}%",
        f"│  🔴 Corrupted (> 5% Diff)      : {len(cat_corrupted):3d} trades ({len(cat_corrupted)/total_trades*100:5.1f}%) | DB PnL: {pnl_corrupted_db:+7.2f}% | TV PnL: {pnl_corrupted_tv:+7.2f}%",
        "├─────────────────────────────────────────────────────────────────────────────────┤",
        f"│  📊 TOTAL CUMULATIVE PnL      : DB-based: {total_pnl_db:+8.2f}%  |  TV Live-based: {total_pnl_tv:+8.2f}%",
        "└─────────────────────────────────────────────────────────────────────────────────┘",
        "",
        "─" * 85,
        " ALL ACTIVE/PENDING TRADES DETAILED COMPARISON TABLE",
        "─" * 85,
        f"{'Symbol':<7} | {'Dir':<4} | {'Entry Price':<11} | {'DB Close':<10} | {'TV Live':<10} | {'Diff %':<7} | {'Source in DB':<16} | {'PnL %':<7}",
        "─" * 85,
    ]

    for r in audit_rows:
        flag = "🔴" if r["diff_vs_db_pct"] > 5.0 else ("🟡" if r["diff_vs_db_pct"] >= 1.0 else "🟢")
        report_lines.append(
            f"{r['symbol']:<7} | {r['direction'].upper():<4} | {r['entry_price']:<11.3f} | "
            f"{r['db_close_price']:<10.3f} | {r['tv_live_price']:<10.3f} | "
            f"{r['diff_vs_db_pct']:>5.1f}% {flag} | {r['db_source']:<16} | {r['pnl_db']:>+6.1f}%"
        )

    if cat_corrupted:
        report_lines.extend([
            "",
            "─" * 85,
            " 🚨 CORRUPTED TRADES HIGHLIGHT (Diff > 5% between Entry and DB Close)",
            "─" * 85,
        ])
        for r in cat_corrupted:
            report_lines.append(
                f"  Symbol: {r['symbol']:<6} | Entry: {r['entry_price']:<8.3f} | DB Close: {r['db_close_price']:<8.3f} "
                f"| Diff: {r['diff_vs_db_pct']:>5.2f}% | Source: {r['db_source']:<15} | Date: {r['db_date']}"
            )

    report_lines.extend([
        "",
        "═" * 85,
        " END OF AUDIT REPORT — Read-Only Mode. No database changes were made.",
        "═" * 85,
    ])

    report_txt = "\n".join(report_lines)
    print(report_txt)

    # ── Save Outputs ──────────────────────────────────────────────────────────
    json_path = log_dir / f"signal_vs_chart_audit_{ts_str}.json"
    txt_path = log_dir / f"signal_vs_chart_audit_{ts_str}.txt"

    output_data = {
        "generated_at": ts_human,
        "summary": {
            "total_trades": total_trades,
            "healthy_count": len(cat_healthy),
            "suspicious_count": len(cat_suspicious),
            "corrupted_count": len(cat_corrupted),
            "pnl_db_total": round(total_pnl_db, 2),
            "pnl_tv_total": round(total_pnl_tv, 2),
            "pnl_corrupted_db": round(pnl_corrupted_db, 2),
        },
        "trades": audit_rows,
    }

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(report_txt)

    logger.info(f"✅ JSON report saved to: {json_path}")
    logger.info(f"✅ TXT report saved to:  {txt_path}")

if __name__ == "__main__":
    run_audit()
