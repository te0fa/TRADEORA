"""
close_stale_signals.py
======================
الخطوة 1: Backup ثم إغلاق الإشارات القديمة المفتوحة بشكل وهمي.

الإشارات المستهدفة:
- أسهم ارتفع سعرها > 20% من سعر الدخول المسجل
- مفتوحة منذ وقت طويل ولم تُغلق عند الوصول للـ TP

التشغيل: python scripts/close_stale_signals.py
         python scripts/close_stale_signals.py --dry-run   (مشاهدة بدون تعديل)
         python scripts/close_stale_signals.py --execute   (تنفيذ فعلي)
"""

import os, sys, json
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))
url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_KEY')
sb = create_client(url, key)

DRY_RUN = '--execute' not in sys.argv

# الأسهم المؤكدة من الـ audit (فرق > 20% بين entry و الآن)
STALE_SYMBOLS = [
    'ORAS',   # entry=71.05,  now=716.75  (+908%)
    'FNAR',   # entry=3.68,   now=13.01   (+253%)
    'MAAL',   # entry=4.02,   now=8.80    (+119%)
    'BIDI',   # entry=1.23,   now=2.12    (+72%)
    'EGAL',   # entry=165.91, now=296.57  (+79%)
    'SAUD',   # entry=13.00,  now=22.28   (+71%)
    'POUL',   # entry=23.37,  now=38.00   (+62%)
    'MBSC',   # entry=149.11, now=245.60  (+65%)
    'BINV',   # entry=30.45,  now=47.58   (+56%)
    'ARCC',   # entry=39.29,  now=56.91   (+45%)
    'TMGH',   # entry=56.24,  now=98.99   (+76%)
]

# GEOS: entry=19.97, now=1.00 → سهم تهاوى — نعامله منفصلاً
CRASHED_SYMBOLS = ['GEOS']

def main():
    print("=" * 70)
    print(" TRADEORA — Stale Signal Closure Script")
    print(f" Mode: {'DRY RUN (no changes)' if DRY_RUN else '⚠️  EXECUTE MODE (will modify DB)'}")
    print(f" Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # ── STEP 1: Fetch all stale trades ──────────────────────────────────────
    all_symbols = STALE_SYMBOLS + CRASHED_SYMBOLS
    res = sb.table('recommended_trades') \
            .select('id, symbol, direction, entry_price, tp1, tp2, sl, status, recommended_at') \
            .in_('symbol', all_symbols) \
            .in_('status', ['active', 'pending']) \
            .execute()
    trades = res.data or []

    if not trades:
        print("\n✅ No stale active/pending trades found for these symbols.")
        return

    # ── STEP 2: Fetch current prices from DB ────────────────────────────────
    print(f"\nFound {len(trades)} stale trades. Fetching current prices...")
    current_prices = {}
    for t in trades:
        sym = t['symbol']
        comp = sb.table('companies').select('id').eq('symbol', sym).maybe_single().execute()
        if comp and comp.data:
            price_res = sb.table('market_prices') \
                          .select('close_price') \
                          .eq('company_id', comp.data['id']) \
                          .order('price_date', desc=True) \
                          .limit(1).execute()
            if price_res.data:
                current_prices[sym] = float(price_res.data[0]['close_price'])

    # ── STEP 3: Backup ───────────────────────────────────────────────────────
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = os.path.join(log_dir, f'stale_signals_backup_{ts}.json')

    backup_data = {
        'backup_time': datetime.now().isoformat(),
        'mode': 'dry_run' if DRY_RUN else 'execute',
        'reason': 'Stale signals with large price deviation — manual closure',
        'trades': trades,
        'current_prices': current_prices
    }
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, ensure_ascii=False, indent=2, default=str)
    print(f"✅ Backup saved: {backup_file}")

    # ── STEP 4: Display & Execute ────────────────────────────────────────────
    print(f"\n{'─'*70}")
    print(f"  {'Symbol':<8} {'Entry':>10} {'Current':>10} {'PnL%':>8} {'Exit Reason':<30}")
    print(f"{'─'*70}")

    closed_count = 0
    for t in trades:
        sym      = t['symbol']
        entry    = float(t['entry_price'])
        current  = current_prices.get(sym, entry)
        direction = t.get('direction', 'buy')

        if direction == 'buy':
            pnl_pct = (current - entry) / entry * 100
        else:
            pnl_pct = (entry - current) / entry * 100

        # Classify exit reason
        if sym in CRASHED_SYMBOLS:
            exit_reason = 'manual_review_crashed_stock'
        elif pnl_pct > 50:
            exit_reason = 'manual_review_stale_signal_large_gain'
        elif pnl_pct > 20:
            exit_reason = 'manual_review_stale_signal_tp_missed'
        else:
            exit_reason = 'manual_review_stale_signal'

        print(f"  {sym:<8} {entry:>10.3f} {current:>10.3f} {pnl_pct:>+7.1f}%  {exit_reason}")

        if not DRY_RUN:
            try:
                sb.table('recommended_trades').update({
                    'status': 'closed',
                    'exit_price': round(current, 3),
                    'exit_reason': exit_reason,
                    'closed_at': datetime.now(timezone.utc).isoformat(),
                    'pnl_percent': round(pnl_pct, 2),
                }).eq('id', t['id']).execute()
                closed_count += 1
            except Exception as e:
                print(f"  ❌ Error closing {sym}: {e}")

    print(f"{'─'*70}")

    if DRY_RUN:
        print(f"\n🔍 DRY RUN complete — {len(trades)} trades would be closed.")
        print("   Run with --execute to apply changes.")
    else:
        print(f"\n✅ Closed {closed_count}/{len(trades)} stale trades.")
        print(f"   Backup: {backup_file}")

    # ── STEP 5: Show new PnL estimate ───────────────────────────────────────
    print(f"\n{'─'*70}")
    print(" ESTIMATED IMPACT ON CUMULATIVE PnL:")
    print(f"  Before: +1654.18% (distorted by {len(trades)} stale trades)")
    print(f"  Remaining trades: 163 - {len(trades)} = {163 - len(trades)}")
    print(f"  Expected range after cleanup: -20% to -70% (approximate)")
    print(f"{'─'*70}\n")

if __name__ == '__main__':
    main()
