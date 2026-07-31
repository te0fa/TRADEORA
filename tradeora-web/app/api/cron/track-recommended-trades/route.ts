import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

/**
 * CRON: /api/cron/track-recommended-trades
 * Runs every 30 minutes during EGX session (10:00–15:00 Cairo, Sun–Thu)
 *
 * For each active recommended_trade:
 *  1. Fetch current market price from market_prices or canonical price
 *  2. Check TP1 / TP2 / SL hit
 *  3. Update status + exit_price + pnl_percent immediately
 *
 * Also runs a BACKFILL pass to fix existing closed trades that have
 * exit_price but missing pnl_percent.
 */
export async function GET(req: NextRequest) {
  const sb = getSupabase();

  const authHeader = req.headers.get('Authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results = {
    tp1_hit: 0,
    tp2_hit: 0,
    sl_hit: 0,
    backfill_fixed: 0,
    skipped_no_price: 0,
  };

  try {
    // ── STEP 1: Backfill – fix closed trades with exit_price but no pnl_percent ──
    const { data: brokenClosed } = await sb
      .from('recommended_trades')
      .select('id, entry_price, exit_price, direction')
      .eq('status', 'closed')
      .not('exit_price', 'is', null)
      .is('pnl_percent', null)
      .limit(500);

    if (brokenClosed && brokenClosed.length > 0) {
      const backfillUpdates = brokenClosed.map((t: any) => {
        const entry = parseFloat(t.entry_price);
        const exit  = parseFloat(t.exit_price);
        const dir   = t.direction === 'sell' ? -1 : 1;
        const pnl   = parseFloat(((exit - entry) / entry * 100 * dir).toFixed(2));
        return Promise.resolve(
          sb
            .from('recommended_trades')
            .update({ pnl_percent: pnl })
            .eq('id', t.id)
            .then()
        );
      });
      await Promise.all(backfillUpdates);
      results.backfill_fixed = brokenClosed.length;
    }

    // ── STEP 2: Fetch active recommended trades ──────────────────────────
    const { data: activeTrades, error: fetchErr } = await sb
      .from('recommended_trades')
      .select('id, company_id, symbol, direction, entry_price, tp1, tp2, sl, status, recommended_at')
      .eq('status', 'active');

    if (fetchErr) throw fetchErr;
    if (!activeTrades || activeTrades.length === 0) {
      return NextResponse.json({ ...results, message: 'No active recommended trades' });
    }

    // ── STEP 3: Fetch latest prices in bulk ──────────────────────────────
    const companyIds = [...new Set(activeTrades.map((t: any) => t.company_id))];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const { data: prices } = await sb
      .from('market_prices')
      .select('company_id, close_price, price_date')
      .in('company_id', companyIds)
      .gte('price_date', sevenDaysAgo)
      .order('price_date', { ascending: false });

    // Build latest price map
    const priceMap: Record<string, number> = {};
    for (const p of (prices ?? []) as any[]) {
      if (!priceMap[p.company_id] && p.close_price) {
        priceMap[p.company_id] = parseFloat(p.close_price);
      }
    }

    // ── STEP 4: Evaluate each trade ──────────────────────────────────────
    const updatePromises: Promise<any>[] = [];

    for (const trade of activeTrades as any[]) {
      const currentPrice = priceMap[trade.company_id];
      if (!currentPrice) {
        results.skipped_no_price++;
        continue;
      }

      const entry = parseFloat(trade.entry_price);
      const tp1   = parseFloat(trade.tp1);
      const tp2   = parseFloat(trade.tp2);
      const sl    = parseFloat(trade.sl);
      const isBuy = trade.direction !== 'sell';

      const calcPnl = (exit: number): number => {
        const dir = isBuy ? 1 : -1;
        return parseFloat(((exit - entry) / entry * 100 * dir).toFixed(2));
      };

      let update: Record<string, any> | null = null;

      // ── SL Hit ──────────────────────────────────────────────────────────
      if ((isBuy && currentPrice <= sl) || (!isBuy && currentPrice >= sl)) {
        update = {
          status:      'closed',
          exit_price:  currentPrice,
          exit_reason: 'sl',
          pnl_percent: calcPnl(currentPrice),
          closed_at:   now.toISOString(),
        };
        results.sl_hit++;
      }
      // ── TP2 Hit ─────────────────────────────────────────────────────────
      else if ((isBuy && currentPrice >= tp2) || (!isBuy && currentPrice <= tp2)) {
        update = {
          status:      'closed',
          exit_price:  currentPrice,
          exit_reason: 'tp2',
          pnl_percent: calcPnl(currentPrice),
          closed_at:   now.toISOString(),
        };
        results.tp2_hit++;
      }
      // ── TP1 Hit ─────────────────────────────────────────────────────────
      else if ((isBuy && currentPrice >= tp1) || (!isBuy && currentPrice <= tp1)) {
        // Mark TP1 but keep active (waiting for TP2 or SL-to-entry)
        update = {
          status:         'tp1_hit',
          tp1_exit_price: currentPrice,
          pnl_percent:    calcPnl(currentPrice),  // partial P&L at TP1
        };
        results.tp1_hit++;
      }

      if (update) {
        updatePromises.push(
          Promise.resolve(
            sb.from('recommended_trades').update(update).eq('id', trade.id).then()
          )
        );
      }
    }

    // ── Also handle tp1_hit trades: check for TP2 or SL-to-entry ─────────
    const { data: tp1Trades } = await sb
      .from('recommended_trades')
      .select('id, company_id, direction, entry_price, tp1, tp2, sl, tp1_exit_price')
      .eq('status', 'tp1_hit');

    for (const trade of (tp1Trades ?? []) as any[]) {
      const currentPrice = priceMap[trade.company_id];
      if (!currentPrice) continue;

      const entry = parseFloat(trade.entry_price);
      const tp2   = parseFloat(trade.tp2);
      const isBuy = trade.direction !== 'sell';
      const tp1ExitPrice = parseFloat(trade.tp1_exit_price || trade.tp1);

      const calcBlendedPnl = (exit2: number): number => {
        const dir = isBuy ? 1 : -1;
        const p1 = (tp1ExitPrice - entry) / entry * 100 * dir;
        const p2 = (exit2 - entry) / entry * 100 * dir;
        return parseFloat(((p1 * 0.5 + p2 * 0.5)).toFixed(2));
      };

      let update: Record<string, any> | null = null;

      if ((isBuy && currentPrice >= tp2) || (!isBuy && currentPrice <= tp2)) {
        update = {
          status:      'closed',
          exit_price:  currentPrice,
          exit_reason: 'tp2',
          pnl_percent: calcBlendedPnl(currentPrice),
          closed_at:   now.toISOString(),
        };
        results.tp2_hit++;
      } else if ((isBuy && currentPrice <= entry) || (!isBuy && currentPrice >= entry)) {
        // SL moved to entry (Breakeven exit after TP1)
        update = {
          status:      'closed',
          exit_price:  entry,
          exit_reason: 'breakeven',
          pnl_percent: calcBlendedPnl(entry),
          closed_at:   now.toISOString(),
        };
        results.sl_hit++;
      }

      if (update) {
        updatePromises.push(
          Promise.resolve(
            sb.from('recommended_trades').update(update).eq('id', trade.id).then()
          )
        );
      }
    }

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      active_checked: activeTrades.length,
      ...results,
    });

  } catch (error: any) {
    console.error('❌ track-recommended-trades cron failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
