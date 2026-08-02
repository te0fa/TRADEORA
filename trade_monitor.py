"""
trade_monitor.py — مراقبة أوتوماتيكية للصفقات وغلقها عند تحقق الأهداف أو الخسارة
===================================================================================
يشتغل كل 10 دقايق من GitHub Actions أثناء الجلسة.
يتحقق من كل الصفقات النشطة ويغلق:
  - صفقة TP2 محقق  → status='closed', exit_reason='tp2_hit', pnl_percent=TP2 gain
  - صفقة TP1 محقق  → status='tp1_hit', pnl_percent=TP1 gain (تظل مفتوحة لـTP2)
  - صفقة SL وصل   → status='closed', exit_reason='sl_hit',  pnl_percent=loss
"""

import os, sys, logging
from datetime import datetime, date, timezone
from pathlib import Path
from dotenv import load_dotenv

# ── Logging ────────────────────────────────────────────────────────────────────
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

load_dotenv()

from supabase import create_client
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
sb = create_client(url, key)


def get_current_price(company_id: str, symbol: str) -> float | None:
    """Get the latest price for a company from market_prices table."""
    if company_id:
        res = sb.table('market_prices') \
            .select('close_price, price_date') \
            .eq('company_id', company_id) \
            .order('price_date', desc=True) \
            .limit(1) \
            .execute()
        if res.data:
            return float(res.data[0]['close_price'])
    return None


def close_trade(trade_id: str, exit_reason: str, pnl_percent: float,
                exit_price: float, new_status: str = 'closed'):
    """Update trade status in DB."""
    sb.table('recommended_trades').update({
        'status':      new_status,
        'exit_reason': exit_reason,
        'pnl_percent': round(pnl_percent, 2),
        'exit_price':  exit_price,
        'closed_at':   datetime.now(timezone.utc).isoformat(),
    }).eq('id', trade_id).execute()
    logger.info(f"  ✅ Updated trade {trade_id}: {new_status} | {exit_reason} | PnL={pnl_percent:+.2f}%")


def update_tp1_hit(trade_id: str, exit_price: float, pnl_percent: float):
    """Mark TP1 as hit — trade remains open for TP2."""
    sb.table('recommended_trades').update({
        'status':      'tp1_hit',
        'pnl_percent': round(pnl_percent, 2),  # Current unrealized PnL at TP1
    }).eq('id', trade_id).execute()
    logger.info(f"  🎯 Trade {trade_id}: TP1 hit! Partial profit {pnl_percent:+.2f}%")


def monitor_trades(dry_run: bool = False) -> dict:
    """
    Main monitoring loop.
    Returns summary dict of actions taken.
    """
    logger.info('=' * 60)
    logger.info(f'Trade Monitor — {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
    logger.info('=' * 60)

    # Fetch all active and tp1_hit trades
    res = sb.table('recommended_trades') \
        .select('id, symbol, company_id, direction, entry_price, tp1, tp2, sl, status, ml_probability') \
        .in_('status', ['active', 'tp1_hit']) \
        .execute()

    trades = res.data or []
    logger.info(f"Found {len(trades)} active/tp1_hit trades to monitor")

    summary = {'total': len(trades), 'tp2_closed': 0, 'tp1_marked': 0, 'sl_closed': 0, 'no_price': 0}

    for trade in trades:
        trade_id   = trade['id']
        symbol     = trade['symbol']
        company_id = trade.get('company_id')
        direction  = (trade.get('direction') or 'buy').lower()
        entry      = float(trade.get('entry_price') or 0)
        tp1        = float(trade.get('tp1') or 0)
        tp2        = float(trade.get('tp2') or 0)
        sl         = float(trade.get('sl') or 0)
        status     = trade.get('status', 'active')
        is_buy     = direction == 'buy'

        if entry <= 0:
            logger.warning(f"  ⚠️  {symbol}: Invalid entry_price={entry}, skipping")
            continue

        # Get current price
        current_price = get_current_price(company_id, symbol)
        if current_price is None:
            logger.warning(f"  ⚠️  {symbol}: No price data available")
            summary['no_price'] += 1
            continue

        # Calculate PnL
        if is_buy:
            pnl_pct = ((current_price - entry) / entry) * 100
        else:
            pnl_pct = ((entry - current_price) / entry) * 100

        logger.info(f"  📊 {symbol}: entry={entry:.2f} current={current_price:.2f} tp1={tp1:.2f} tp2={tp2:.2f} sl={sl:.2f} pnl={pnl_pct:+.2f}% [{status}]")

        # ── Check TP2 hit (full target reached → close trade as WIN) ────────
        if is_buy and tp2 > 0 and current_price >= tp2:
            pnl = ((tp2 - entry) / entry) * 100
            logger.info(f"  🏆 {symbol}: TP2 HIT! price={current_price:.2f} >= tp2={tp2:.2f} → closing with PnL={pnl:+.2f}%")
            if not dry_run:
                close_trade(trade_id, 'tp2_hit', pnl, tp2, 'closed')
            summary['tp2_closed'] += 1
            continue

        if not is_buy and tp2 > 0 and current_price <= tp2:
            pnl = ((entry - tp2) / entry) * 100
            logger.info(f"  🏆 {symbol}: TP2 HIT (SELL)! price={current_price:.2f} <= tp2={tp2:.2f} → closing with PnL={pnl:+.2f}%")
            if not dry_run:
                close_trade(trade_id, 'tp2_hit', pnl, tp2, 'closed')
            summary['tp2_closed'] += 1
            continue

        # ── Check SL hit (stop loss → close trade as LOSS) ─────────────────
        if is_buy and sl > 0 and current_price <= sl:
            pnl = ((sl - entry) / entry) * 100   # negative
            logger.info(f"  ❌ {symbol}: SL HIT! price={current_price:.2f} <= sl={sl:.2f} → closing with PnL={pnl:+.2f}%")
            if not dry_run:
                close_trade(trade_id, 'sl_hit', pnl, sl, 'closed')
            summary['sl_closed'] += 1
            continue

        if not is_buy and sl > 0 and current_price >= sl:
            pnl = ((entry - sl) / entry) * 100   # negative for sell
            logger.info(f"  ❌ {symbol}: SL HIT (SELL)! price={current_price:.2f} >= sl={sl:.2f} → closing with PnL={pnl:+.2f}%")
            if not dry_run:
                close_trade(trade_id, 'sl_hit', pnl, sl, 'closed')
            summary['sl_closed'] += 1
            continue

        # ── Check TP1 hit (partial target → update status, keep open for TP2)
        if status == 'active':
            if is_buy and tp1 > 0 and current_price >= tp1:
                pnl = ((tp1 - entry) / entry) * 100
                logger.info(f"  🎯 {symbol}: TP1 HIT! price={current_price:.2f} >= tp1={tp1:.2f} → partial profit {pnl:+.2f}%")
                if not dry_run:
                    update_tp1_hit(trade_id, tp1, pnl)
                summary['tp1_marked'] += 1

            elif not is_buy and tp1 > 0 and current_price <= tp1:
                pnl = ((entry - tp1) / entry) * 100
                logger.info(f"  🎯 {symbol}: TP1 HIT (SELL)! price={current_price:.2f} <= tp1={tp1:.2f} → partial profit {pnl:+.2f}%")
                if not dry_run:
                    update_tp1_hit(trade_id, tp1, pnl)
                summary['tp1_marked'] += 1

    logger.info('─' * 40)
    logger.info(f"📊 Summary:")
    logger.info(f"  Total monitored: {summary['total']}")
    logger.info(f"  TP2 closed:      {summary['tp2_closed']}")
    logger.info(f"  TP1 marked:      {summary['tp1_marked']}")
    logger.info(f"  SL closed:       {summary['sl_closed']}")
    logger.info(f"  No price data:   {summary['no_price']}")
    if dry_run:
        logger.info("  [DRY RUN — no changes made to DB]")
    logger.info('─' * 40)

    return summary


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Trade Monitor — auto-close TP/SL')
    parser.add_argument('--dry-run', action='store_true', help='Print actions without saving to DB')
    args = parser.parse_args()

    monitor_trades(dry_run=args.dry_run)
