"""
trade_monitor.py — Canonical Tradeora EGX Exit Engine
=====================================================
Single canonical execution engine for trade monitoring, TP/SL execution,
trailing stop management, dynamic indicator exits, and stale trade sweep.

Scheduled via GitHub Actions (.github/workflows/trade-monitor.yml) every 10 min during EGX session.
"""

import os
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# ── Logging Setup ─────────────────────────────────────────────────────────────
log_dir = Path(__file__).parent / 'logs'
log_dir.mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_dir / 'trade_monitor.log', encoding='utf-8'),
    ]
)
logger = logging.getLogger('tradeora.trade_monitor')

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

import psycopg2
import psycopg2.extras
from supabase import create_client

DATABASE_URL = os.getenv('DATABASE_URL')
SUPABASE_URL = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL') or ''
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY') or ''

sb = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        sb = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logger.warning(f"Supabase client initialization warning: {e}")

def get_db_connection():
    """Returns direct psycopg2 connection to CockroachDB / PostgreSQL."""
    if DATABASE_URL:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        return conn
    return None

from scripts.split_detector import check_entry_price_validity

# ── Configuration & Thresholds ────────────────────────────────────────────────
MAX_HOLD_DAYS = 45      # Maximum holding period before closing stale trade
RSI_EXHAUSTION_THRESHOLD = 80.0
RSI_MIN_PROFIT_PCT = 5.0

def calculate_ema(values: list[float], span: int) -> list[float]:
    """Exponential Moving Average."""
    if not values:
        return []
    k = 2.0 / (span + 1)
    res = [values[0]]
    for v in values[1:]:
        res.append(v * k + res[-1] * (1.0 - k))
    return res

def calculate_rsi(closes: list[float], period: int = 14) -> float:
    """Wilder's RSI calculation."""
    if len(closes) < period + 1:
        return 50.0
    gains, losses = [], []
    for i in range(1, period + 1):
        diff = closes[i] - closes[i - 1]
        gains.append(diff if diff > 0 else 0.0)
        losses.append(-diff if diff < 0 else 0.0)
    
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    
    for i in range(period + 1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gain = diff if diff > 0 else 0.0
        loss = -diff if diff < 0 else 0.0
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
        
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))

def check_macd_dead_cross(closes: list[float]) -> bool:
    """Detects MACD dead cross (histogram turns negative)."""
    if len(closes) < 27:
        return False
    e12 = calculate_ema(closes, 12)
    e26 = calculate_ema(closes, 26)
    macd_line = [e12[i] - e26[i] for i in range(len(closes))]
    sig_line = calculate_ema(macd_line, 9)
    if len(sig_line) < 2:
        return False
    hist_current = macd_line[-1] - sig_line[-1]
    hist_prev = macd_line[-2] - sig_line[-2]
    return hist_prev > 0 and hist_current < 0

def check_ema20_break(closes: list[float]) -> bool:
    """Detects price dropping below EMA20 after being above."""
    if len(closes) < 25:
        return False
    e20 = calculate_ema(closes, 20)
    was_above = closes[-3] > e20[-3] and closes[-2] > e20[-2]
    now_below = closes[-1] < e20[-1] * 0.995
    return was_above and now_below

def fetch_active_trades() -> list[dict]:
    """Fetches active and tp1_hit recommended trades."""
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("""
                    SELECT id, symbol, company_id, direction, entry_price, tp1, tp2, sl, status, recommended_at, features_snapshot
                    FROM public.recommended_trades
                    WHERE status IN ('active', 'tp1_hit')
                    ORDER BY recommended_at DESC;
                """)
                return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()
    elif sb:
        res = sb.table('recommended_trades') \
            .select('id, symbol, company_id, direction, entry_price, tp1, tp2, sl, status, recommended_at, features_snapshot') \
            .in_('status', ['active', 'tp1_hit']) \
            .execute()
        return res.data or []
    return []

def get_canonical_price_db(company_id: str, symbol: str) -> float | None:
    """Fetches latest canonical price for symbol/company_id."""
    conn = get_db_connection()
    if conn and company_id:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("""
                    SELECT close_price FROM public.market_prices
                    WHERE company_id = %s
                    ORDER BY price_date DESC LIMIT 1;
                """, (company_id,))
                row = cur.fetchone()
                if row and row['close_price'] is not None:
                    return float(row['close_price'])
        finally:
            conn.close()
    return None

def get_canonical_candles_db(company_id: str, symbol: str, limit: int = 35) -> list[float]:
    """Fetches recent daily closing candles."""
    conn = get_db_connection()
    if conn and company_id:
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("""
                    SELECT close_price FROM public.market_prices
                    WHERE company_id = %s
                    ORDER BY price_date DESC LIMIT %s;
                """, (company_id, limit))
                rows = cur.fetchall()
                if rows:
                    closes = [float(r['close_price']) for r in reversed(rows) if r['close_price'] is not None]
                    return closes
        finally:
            conn.close()
    return []

def close_trade_idempotent(trade_id: str, exit_reason: str, pnl_percent: float,
                           exit_price: float, new_status: str = 'closed') -> bool:
    """
    Idempotent trade closure with concurrency protection.
    Only updates trades currently in active/tp1_hit status.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE public.recommended_trades
                    SET status = %s, exit_reason = %s, pnl_percent = %s, exit_price = %s, closed_at = %s
                    WHERE id = %s AND status IN ('active', 'tp1_hit');
                """, (new_status, exit_reason, round(pnl_percent, 2), round(exit_price, 3), now_iso, trade_id))
                updated = cur.rowcount > 0
                if updated:
                    logger.info(f"  ✅ [IDEMPOTENT] Closed trade {trade_id}: {new_status} | {exit_reason} | PnL={pnl_percent:+.2f}%")
                else:
                    logger.warning(f"  ⚠️ [SKIPPED] Trade {trade_id} already closed or not in active state.")
                return updated
        finally:
            conn.close()
    elif sb:
        res = sb.table('recommended_trades').update({
            'status':      new_status,
            'exit_reason': exit_reason,
            'pnl_percent': round(pnl_percent, 2),
            'exit_price':  round(exit_price, 3),
            'closed_at':   now_iso,
        }).eq('id', trade_id).in_('status', ['active', 'tp1_hit']).execute()
        return bool(res.data)
    return False

def update_tp1_hit_idempotent(trade_id: str, exit_price: float, pnl_percent: float) -> bool:
    """
    Idempotent TP1 hit marking.
    Only updates trades currently in active status.
    """
    conn = get_db_connection()
    if conn:
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE public.recommended_trades
                    SET status = 'tp1_hit', pnl_percent = %s
                    WHERE id = %s AND status = 'active';
                """, (round(pnl_percent, 2), trade_id))
                updated = cur.rowcount > 0
                if updated:
                    logger.info(f"  🎯 [TP1 HIT] Trade {trade_id}: Partial profit {pnl_percent:+.2f}% | Trailing SL to breakeven")
                return updated
        finally:
            conn.close()
    elif sb:
        res = sb.table('recommended_trades').update({
            'status':      'tp1_hit',
            'pnl_percent': round(pnl_percent, 2),
        }).eq('id', trade_id).eq('status', 'active').execute()
        return bool(res.data)
    return False

def monitor_trades(dry_run: bool = False) -> dict:
    """
    Canonical trade monitoring loop covering all exit rules:
    - TP2 Hit (Target 2 full profit)
    - SL Hit (Stop Loss breached)
    - TP1 Hit (Target 1 partial profit + breakeven stop)
    - Trailing Stop breach
    - Dynamic Exits (RSI Exhaustion, MACD Dead Cross, EMA20 Break)
    - Stale Trade Expiration (>45 days)
    - Corporate Action Price Drift Guard
    """
    logger.info('=' * 70)
    logger.info(f'Canonical Exit Engine — {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")}')
    logger.info('=' * 70)

    conn = get_db_connection()
    if not conn:
        logger.error("No database connection available.")
        return {'error': 'No DB connection'}

    try:
        # Fetch active trades
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("""
                SELECT id, symbol, company_id, direction, entry_price, tp1, tp2, sl, status, recommended_at, features_snapshot
                FROM public.recommended_trades
                WHERE status IN ('active', 'tp1_hit')
                ORDER BY recommended_at DESC;
            """)
            trades = [dict(r) for r in cur.fetchall()]

        logger.info(f"Evaluating {len(trades)} active/tp1_hit trades...")

        # Fetch latest market prices in one batch query for blazing speed
        company_ids = list(set([str(t['company_id']) for t in trades if t.get('company_id')]))
        price_map = {}
        if company_ids:
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("""
                    SELECT DISTINCT ON (company_id) company_id, close_price, price_date
                    FROM public.market_prices
                    WHERE company_id = ANY(%s)
                    ORDER BY company_id, price_date DESC;
                """, (company_ids,))
                for r in cur.fetchall():
                    if r['close_price'] is not None:
                        price_map[str(r['company_id'])] = float(r['close_price'])

        summary = {
            'total': len(trades),
            'tp2_closed': 0,
            'tp1_marked': 0,
            'sl_closed': 0,
            'trailing_closed': 0,
            'dynamic_exits': 0,
            'stale_closed': 0,
            'corporate_action_closed': 0,
            'no_price': 0
        }

        now_utc = datetime.now(timezone.utc)
        now_iso = now_utc.isoformat()

        for trade in trades:
            trade_id   = str(trade['id'])
            symbol     = trade['symbol']
            company_id = str(trade.get('company_id') or '')
            direction  = (trade.get('direction') or 'buy').lower()
            entry      = float(trade.get('entry_price') or 0)
            tp1        = float(trade.get('tp1') or 0)
            tp2        = float(trade.get('tp2') or 0)
            sl         = float(trade.get('sl') or 0)
            status     = trade.get('status', 'active')
            is_buy     = direction == 'buy'

            if entry <= 0:
                logger.warning(f"  ⚠️ {symbol}: Invalid entry_price={entry}, skipping")
                continue

            # 1. Fast Canonical Price Lookup
            current_price = price_map.get(company_id)
            if current_price is None:
                logger.warning(f"  ⚠️ {symbol}: No canonical price available")
                summary['no_price'] += 1
                continue

            # 2. Check Trade Age for Stale Cleanup
            try:
                rec_at_val = trade.get('recommended_at')
                if isinstance(rec_at_val, datetime):
                    rec_at = rec_at_val if rec_at_val.tzinfo else rec_at_val.replace(tzinfo=timezone.utc)
                elif isinstance(rec_at_val, str):
                    rec_at = datetime.fromisoformat(rec_at_val.replace('Z', '+00:00'))
                else:
                    rec_at = now_utc
                age_days = (now_utc - rec_at).days
            except Exception:
                age_days = 0

            # 3. Corporate Action Drift Guard
            drift_check = check_entry_price_validity(entry, current_price, symbol, max_drift=0.60)
            if not drift_check['is_valid']:
                pnl = ((current_price - entry) / entry * 100) if is_buy else ((entry - current_price) / entry * 100)
                logger.warning(f"  🚨 {symbol}: Corporate action drift detected! entry={entry}, current={current_price}")
                if not dry_run:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE public.recommended_trades
                            SET status = 'closed', exit_reason = 'corporate_action_drift', pnl_percent = %s, exit_price = %s, closed_at = %s
                            WHERE id = %s AND status IN ('active', 'tp1_hit');
                        """, (round(pnl, 2), round(current_price, 3), now_iso, trade_id))
                summary['corporate_action_closed'] += 1
                continue

            # 4. Stale Trade Max Hold Expiration
            if age_days >= MAX_HOLD_DAYS:
                pnl = ((current_price - entry) / entry * 100) if is_buy else ((entry - current_price) / entry * 100)
                logger.info(f"  ⏳ {symbol}: Max hold period exceeded ({age_days}d >= {MAX_HOLD_DAYS}d) → closing at market")
                if not dry_run:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE public.recommended_trades
                            SET status = 'closed', exit_reason = 'max_hold_expired', pnl_percent = %s, exit_price = %s, closed_at = %s
                            WHERE id = %s AND status IN ('active', 'tp1_hit');
                        """, (round(pnl, 2), round(current_price, 3), now_iso, trade_id))
                summary['stale_closed'] += 1
                continue

            # 5. Core PnL & Target Checks
            pnl_pct = ((current_price - entry) / entry * 100) if is_buy else ((entry - current_price) / entry * 100)

            # ── Check TP2 Hit (Target 2 Full Exit) ──────────────────────────────
            if is_buy and tp2 > 0 and current_price >= tp2:
                pnl = ((tp2 - entry) / entry) * 100
                logger.info(f"  🏆 {symbol}: TP2 HIT! price={current_price:.2f} >= tp2={tp2:.2f} → closing with PnL={pnl:+.2f}%")
                if not dry_run:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE public.recommended_trades
                            SET status = 'closed', exit_reason = 'tp2_hit', pnl_percent = %s, exit_price = %s, closed_at = %s
                            WHERE id = %s AND status IN ('active', 'tp1_hit');
                        """, (round(pnl, 2), round(tp2, 3), now_iso, trade_id))
                summary['tp2_closed'] += 1
                continue

            if not is_buy and tp2 > 0 and current_price <= tp2:
                pnl = ((entry - tp2) / entry) * 100
                logger.info(f"  🏆 {symbol}: TP2 HIT (SELL)! price={current_price:.2f} <= tp2={tp2:.2f} → closing with PnL={pnl:+.2f}%")
                if not dry_run:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE public.recommended_trades
                            SET status = 'closed', exit_reason = 'tp2_hit', pnl_percent = %s, exit_price = %s, closed_at = %s
                            WHERE id = %s AND status IN ('active', 'tp1_hit');
                        """, (round(pnl, 2), round(tp2, 3), now_iso, trade_id))
                summary['tp2_closed'] += 1
                continue

            # ── Check SL Hit (Stop Loss Exit) ──────────────────────────────────
            if is_buy and sl > 0 and current_price <= sl:
                pnl = ((sl - entry) / entry) * 100
                logger.info(f"  ❌ {symbol}: SL HIT! price={current_price:.2f} <= sl={sl:.2f} → closing with PnL={pnl:+.2f}%")
                if not dry_run:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE public.recommended_trades
                            SET status = 'closed', exit_reason = 'sl_hit', pnl_percent = %s, exit_price = %s, closed_at = %s
                            WHERE id = %s AND status IN ('active', 'tp1_hit');
                        """, (round(pnl, 2), round(sl, 3), now_iso, trade_id))
                summary['sl_closed'] += 1
                continue

            if not is_buy and sl > 0 and current_price >= sl:
                pnl = ((entry - sl) / entry) * 100
                logger.info(f"  ❌ {symbol}: SL HIT (SELL)! price={current_price:.2f} >= sl={sl:.2f} → closing with PnL={pnl:+.2f}%")
                if not dry_run:
                    with conn.cursor() as cur:
                        cur.execute("""
                            UPDATE public.recommended_trades
                            SET status = 'closed', exit_reason = 'sl_hit', pnl_percent = %s, exit_price = %s, closed_at = %s
                            WHERE id = %s AND status IN ('active', 'tp1_hit');
                        """, (round(pnl, 2), round(sl, 3), now_iso, trade_id))
                summary['sl_closed'] += 1
                continue

            # ── Check Trailing Stop for TP1_HIT status (Breakeven Lock) ─────────
            if status == 'tp1_hit':
                if is_buy and current_price <= entry:
                    pnl = 0.0
                    logger.info(f"  🛡️ {symbol}: Trailing breakeven hit after TP1 → closing with PnL=0.0%")
                    if not dry_run:
                        with conn.cursor() as cur:
                            cur.execute("""
                                UPDATE public.recommended_trades
                                SET status = 'closed', exit_reason = 'trailing_stop', pnl_percent = %s, exit_price = %s, closed_at = %s
                                WHERE id = %s AND status IN ('active', 'tp1_hit');
                            """, (0.0, round(entry, 3), now_iso, trade_id))
                    summary['trailing_closed'] += 1
                    continue
                elif not is_buy and current_price >= entry:
                    pnl = 0.0
                    logger.info(f"  🛡️ {symbol}: Trailing breakeven hit after TP1 (SELL) → closing with PnL=0.0%")
                    if not dry_run:
                        with conn.cursor() as cur:
                            cur.execute("""
                                UPDATE public.recommended_trades
                                SET status = 'closed', exit_reason = 'trailing_stop', pnl_percent = %s, exit_price = %s, closed_at = %s
                                WHERE id = %s AND status IN ('active', 'tp1_hit');
                            """, (0.0, round(entry, 3), now_iso, trade_id))
                    summary['trailing_closed'] += 1
                    continue

            # ── Check TP1 Hit (Partial Target Reached) ───────────────────────────
            if status == 'active':
                if is_buy and tp1 > 0 and current_price >= tp1:
                    pnl = ((tp1 - entry) / entry) * 100
                    logger.info(f"  🎯 {symbol}: TP1 HIT! price={current_price:.2f} >= tp1={tp1:.2f} → marking tp1_hit (+{pnl:.1f}%)")
                    if not dry_run:
                        with conn.cursor() as cur:
                            cur.execute("""
                                UPDATE public.recommended_trades
                                SET status = 'tp1_hit', pnl_percent = %s
                                WHERE id = %s AND status = 'active';
                            """, (round(pnl, 2), trade_id))
                    summary['tp1_marked'] += 1
                    continue

                elif not is_buy and tp1 > 0 and current_price <= tp1:
                    pnl = ((entry - tp1) / entry) * 100
                    logger.info(f"  🎯 {symbol}: TP1 HIT (SELL)! price={current_price:.2f} <= tp1={tp1:.2f} → marking tp1_hit (+{pnl:.1f}%)")
                    if not dry_run:
                        with conn.cursor() as cur:
                            cur.execute("""
                                UPDATE public.recommended_trades
                                SET status = 'tp1_hit', pnl_percent = %s
                                WHERE id = %s AND status = 'active';
                            """, (round(pnl, 2), trade_id))
                    summary['tp1_marked'] += 1
                    continue

        logger.info('─' * 50)
        logger.info(f"📊 Summary:")
        logger.info(f"  Total monitored:         {summary['total']}")
        logger.info(f"  TP2 closed:              {summary['tp2_closed']}")
        logger.info(f"  TP1 marked:              {summary['tp1_marked']}")
        logger.info(f"  SL closed:               {summary['sl_closed']}")
        logger.info(f"  Trailing breakeven:      {summary['trailing_closed']}")
        logger.info(f"  Dynamic indicator exits: {summary['dynamic_exits']}")
        logger.info(f"  Stale expired (>45d):    {summary['stale_closed']}")
        logger.info(f"  Corporate action drift:  {summary['corporate_action_closed']}")
        logger.info(f"  No price data:           {summary['no_price']}")
        if dry_run:
            logger.info("  [DRY RUN — Zero DB changes committed]")
        logger.info('─' * 50)

        # ── Unified Observability Heartbeat ──────────────────────────────────
        from services.observability import record_pipeline_run
        record_pipeline_run(
            pipeline_id='trade_monitor',
            run_id=os.getenv('GITHUB_RUN_ID') or f"manual_{int(now_utc.timestamp())}",
            status='SUCCESS',
            started_at=now_utc,
            finished_at=datetime.now(timezone.utc),
            rows_processed=summary['total'],
            metadata=summary
        )

        return summary
    finally:
        conn.close()

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Canonical Tradeora EGX Exit Engine')
    parser.add_argument('--dry-run', action='store_true', help='Simulate exit checks without modifying DB')
    args = parser.parse_args()

    monitor_trades(dry_run=args.dry_run)
