"""
signal_guardian.py
==================
الحارس التلقائي للإشارات — يمنع تكرار مشاكل الإشارات المفتوحة للأبد.

يتشغّل كل يوم بعد generate_daily_recommendations.py مباشرة.

يحل 3 مشاكل تلقائياً:
  1. Max Hold Period: أي إشارة > 45 يوم → تُغلق بسعر السوق
  2. TP Auto-Closure: إشارة وصلت TP1 أو TP2 → تُغلق
  3. SL Auto-Closure: إشارة وصلت SL → تُغلق بخسارة

التشغيل: python signal_guardian.py
"""

import os, sys, logging
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path
from scripts.split_detector import check_entry_price_validity

load_dotenv(dotenv_path=Path(__file__).parent / '.env')

log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join(log_dir, 'signal_guardian.log'), encoding='utf-8')
    ]
)
logger = logging.getLogger("tradeora.guardian")

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY")
sb: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── إعدادات قابلة للتعديل ───────────────────────────────────────────────────
MAX_HOLD_DAYS   = 45    # أقصى عمر للإشارة المفتوحة (يوم)
STALE_WARN_DAYS = 30    # تحذير بعد كم يوم (بدون إغلاق)
PRICE_SNAP_PCT  = 0.005 # هامش تسامح عند مقارنة السعر بالـ TP/SL (0.5%)
# ────────────────────────────────────────────────────────────────────────────


from services.canonical import get_canonical_price as get_canonical_price_canonical

def get_canonical_price(company_id: str) -> float | None:
    """جلب آخر سعر موثوق باستخدام Canonical Market Data Layer الرسمية."""
    res = get_canonical_price_canonical(sb, company_id, "")
    if res and res.get('price'):
        return res['price']
    return None


def run_guardian():
    logger.info("=" * 60)
    logger.info("Signal Guardian — Starting daily sweep")
    logger.info(f"Rules: MaxHold={MAX_HOLD_DAYS}d | Snap={PRICE_SNAP_PCT*100:.1f}%")
    logger.info("=" * 60)

    # جلب كل الإشارات المفتوحة
    res = sb.table('recommended_trades') \
            .select('id, company_id, symbol, direction, entry_price, tp1, tp2, sl, status, recommended_at') \
            .in_('status', ['active', 'pending']) \
            .execute()
    trades = res.data or []
    logger.info(f"Found {len(trades)} open signals to evaluate.")

    now_utc = datetime.now(timezone.utc)
    stats = {'tp_closed': 0, 'sl_closed': 0, 'expired': 0, 'warned': 0, 'skipped': 0}

    for t in trades:
        symbol     = t['symbol']
        company_id = t.get('company_id')
        direction  = t.get('direction', 'buy')
        is_buy     = direction == 'buy'

        try:
            entry  = float(t['entry_price'])
            tp1    = float(t['tp1'])   if t.get('tp1') else None
            tp2    = float(t['tp2'])   if t.get('tp2') else None
            sl     = float(t['sl'])    if t.get('sl')  else None
        except (TypeError, ValueError):
            logger.warning(f"[{symbol}] Invalid price fields — skipping")
            stats['skipped'] += 1
            continue

        # حساب عمر الإشارة
        try:
            rec_at_str = t.get('recommended_at', '')
            if rec_at_str:
                rec_at = datetime.fromisoformat(rec_at_str.replace('Z', '+00:00'))
                age_days = (now_utc - rec_at).days
            else:
                age_days = 0
        except Exception:
            age_days = 0

        # جلب السعر الحالي
        current = get_canonical_price(company_id) if company_id else None
        if not current:
            logger.warning(f"[{symbol}] No current price found — skipping")
            stats['skipped'] += 1
            continue

        # ── Corporate Action / Entry Price Drift Guard ──────────────────────
        validity = check_entry_price_validity(
            entry_price=entry,
            current_price=current,
            symbol=symbol,
            max_drift=0.60   # 60% drift = suspicious corporate action
        )
        if not validity['is_valid']:
            try:
                sb.table('recommended_trades').update({
                    'status':      'closed',
                    'exit_price':  round(current, 3),
                    'closed_at':   now_utc.isoformat(),
                    'exit_reason': 'corporate_action_detected',
                }).eq('id', t['id']).execute()
            except Exception as ex:
                logger.error(f"[{symbol}] DB update failed for corporate action closure: {ex}")
            
            logger.warning(
                f"[{symbol}] Signal closed due to corporate action: drift={validity['drift_pct']*100:.1f}%"
            )
            stats['corporate_closed'] = stats.get('corporate_closed', 0) + 1
            continue
        # ───────────────────────────────────────────────────────────────────

        close_updates = None
        close_reason  = None

        # ── القاعدة 1: Max Hold Period ────────────────────────────────────
        if age_days >= MAX_HOLD_DAYS:
            pnl = (current - entry) / entry * 100 if is_buy else (entry - current) / entry * 100
            close_reason  = f'max_hold_period_{MAX_HOLD_DAYS}d'
            close_updates = {'pnl_percent': round(pnl, 2), 'exit_price': round(current, 3)}
            logger.info(f"[{symbol}] EXPIRED ({age_days}d > {MAX_HOLD_DAYS}d limit) | PnL={pnl:+.1f}% | {close_reason}")
            stats['expired'] += 1

        # ── القاعدة 2: TP Auto-Closure ────────────────────────────────────
        elif tp2 and ((is_buy and current >= tp2 * (1 - PRICE_SNAP_PCT)) or
                      (not is_buy and current <= tp2 * (1 + PRICE_SNAP_PCT))):
            pnl = (current - entry) / entry * 100 if is_buy else (entry - current) / entry * 100
            close_reason  = 'tp2_auto'
            close_updates = {'pnl_percent': round(pnl, 2), 'exit_price': round(current, 3)}
            logger.info(f"[{symbol}] TP2 HIT | Price={current} vs TP2={tp2} | PnL={pnl:+.1f}%")
            stats['tp_closed'] += 1

        elif tp1 and ((is_buy and current >= tp1 * (1 - PRICE_SNAP_PCT)) or
                      (not is_buy and current <= tp1 * (1 + PRICE_SNAP_PCT))):
            pnl = (current - entry) / entry * 100 if is_buy else (entry - current) / entry * 100
            close_reason  = 'tp1_auto'
            close_updates = {'pnl_percent': round(pnl, 2), 'exit_price': round(current, 3)}
            logger.info(f"[{symbol}] TP1 HIT | Price={current} vs TP1={tp1} | PnL={pnl:+.1f}%")
            stats['tp_closed'] += 1

        # ── القاعدة 3: SL Auto-Closure ────────────────────────────────────
        elif sl and ((is_buy and current <= sl * (1 + PRICE_SNAP_PCT)) or
                     (not is_buy and current >= sl * (1 - PRICE_SNAP_PCT))):
            pnl = (current - entry) / entry * 100 if is_buy else (entry - current) / entry * 100
            close_reason  = 'sl_auto'
            close_updates = {'pnl_percent': round(pnl, 2), 'exit_price': round(current, 3)}
            logger.info(f"[{symbol}] SL HIT | Price={current} vs SL={sl} | PnL={pnl:+.1f}%")
            stats['sl_closed'] += 1

        # ── تحذير (إشارة قديمة لكن لم تصل لـ max_hold) ──────────────────
        elif age_days >= STALE_WARN_DAYS:
            pnl = (current - entry) / entry * 100 if is_buy else (entry - current) / entry * 100
            logger.warning(f"[{symbol}] STALE WARNING: {age_days}d old | Current={current} vs Entry={entry} | PnL={pnl:+.1f}%")
            stats['warned'] += 1

        # ── تطبيق الإغلاق ─────────────────────────────────────────────────
        if close_updates and close_reason:
            close_updates.update({
                'status': 'closed',
                'exit_reason': close_reason,
                'closed_at': now_utc.isoformat(),
            })
            try:
                sb.table('recommended_trades') \
                  .update(close_updates) \
                  .eq('id', t['id']) \
                  .execute()
            except Exception as e:
                logger.error(f"[{symbol}] DB update failed: {e}")

    # ── ملخص ──────────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info(f"Guardian sweep complete:")
    logger.info(f"  TP auto-closed   : {stats['tp_closed']}")
    logger.info(f"  SL auto-closed   : {stats['sl_closed']}")
    logger.info(f"  Corporate closed : {stats.get('corporate_closed', 0)}")
    logger.info(f"  Expired (>{MAX_HOLD_DAYS}d): {stats['expired']}")
    logger.info(f"  Stale warnings   : {stats['warned']}")
    logger.info(f"  Skipped          : {stats['skipped']}")
    logger.info("=" * 60)


if __name__ == '__main__':
    run_guardian()
