import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchExitSignal } from '@/lib/alert-dispatcher';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// ── Dynamic Exit Engine ──────────────────────────────────────────────────────
// Based on backtest findings:
//   intraday avg PnL = -5.25%  (exit too late/early)
//   3-5 day trades   = +76.9% WR (optimal hold period)
// Solution: intelligent trailing stop + momentum-based exit signals

/** Compute EMA for an array */
function ema(arr: number[], span: number): number[] {
  const k = 2 / (span + 1);
  const result: number[] = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    result.push(arr[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

/** Wilder's RSI */
function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d; else avgLoss -= d;
  }
  avgGain /= period; avgLoss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (d > 0 ? d : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (d < 0 ? -d : 0)) / period;
  }
  return avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
}

/** MACD histogram (12/26/9) */
function macdHist(closes: number[]): { hist: number; histPrev: number; deadCross: boolean } {
  if (closes.length < 27) return { hist: 0, histPrev: 0, deadCross: false };
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const ml  = e12.map((v, i) => v - e26[i]);
  const sig = ema(ml, 9);
  const hist    = ml[ml.length - 1] - sig[sig.length - 1];
  const histPrev= ml[ml.length - 2] - sig[sig.length - 2];
  return { hist, histPrev, deadCross: histPrev > 0 && hist < 0 };
}

/** EMA20 – is price below EMA20 after being above? */
function ema20Break(closes: number[]): boolean {
  if (closes.length < 25) return false;
  const e20   = ema(closes, 20);
  const last  = closes.length - 1;
  const wasAbove = closes[last - 3] > e20[last - 3] && closes[last - 2] > e20[last - 2];
  const nowBelow = closes[last] < e20[last] * 0.995;
  return wasAbove && nowBelow;
}

/** Compute trailing stop level:
 *   Phase 1: price < TP1              → original SL (unchanged)
 *   Phase 2: price reaches TP1        → move SL to entry (break-even)
 *   Phase 3: price > TP1 by 3%+       → trail at highest × 0.94
 *   Phase 4: price > TP2              → trail at highest × 0.96 (lock gains)
 */
function computeTrailingStop(
  entry: number, tp1: number, tp2: number, sl: number,
  currentPrice: number, highestSinceEntry: number, isBuy: boolean
): { newSl: number; trailingActive: boolean; phase: string } {
  if (!isBuy) return { newSl: sl, trailingActive: false, phase: 'sell_not_supported' };

  const high = Math.max(highestSinceEntry, currentPrice);

  if (currentPrice >= tp2) {
    // Phase 4: Price above TP2 → tight trail at -4%
    const trail = high * 0.96;
    return { newSl: Math.max(sl, trail), trailingActive: true, phase: 'phase4_tp2_exceeded' };
  } else if (currentPrice >= tp1 * 1.03) {
    // Phase 3: 3%+ above TP1 → trail at -6%
    const trail = high * 0.94;
    return { newSl: Math.max(sl, trail), trailingActive: true, phase: 'phase3_trailing' };
  } else if (currentPrice >= tp1) {
    // Phase 2: TP1 reached → SL moves to entry (break-even)
    return { newSl: Math.max(sl, entry), trailingActive: true, phase: 'phase2_breakeven' };
  }
  // Phase 1: No change
  return { newSl: sl, trailingActive: false, phase: 'phase1_original' };
}

/** Evaluate all dynamic exit signals for one trade */
function evaluateDynamicExit(
  closes: number[], entry: number, tp1: number, tp2: number,
  currentSl: number, currentPrice: number, highestSinceEntry: number,
  isBuy: boolean, unrealizedPnlPct: number
): {
  exitNow: boolean;
  reason: string;
  reasonAr: string;
  urgency: 'critical' | 'high' | 'medium' | 'low' | 'none';
  newSl: number;
  trailingPhase: string;
} {
  // ── Trailing Stop ─────────────────────────────────────────────────────────
  const { newSl, trailingActive, phase } = computeTrailingStop(
    entry, tp1, tp2, currentSl, currentPrice, highestSinceEntry, isBuy
  );

  // If trailing stop was hit
  if (trailingActive && isBuy && currentPrice <= newSl) {
    return {
      exitNow: true, reason: 'trailing_stop',
      reasonAr: `وقف متحرك مُفعَّل: السعر ${currentPrice.toFixed(2)} كسر مستوى الحماية ${newSl.toFixed(2)}`,
      urgency: 'critical', newSl, trailingPhase: phase
    };
  }

  const rsiVal   = rsi(closes);
  const { hist, histPrev, deadCross } = macdHist(closes);
  const ema20Brk = ema20Break(closes);

  // ── RSI Exhaustion ────────────────────────────────────────────────────────
  if (isBuy && rsiVal >= 80 && unrealizedPnlPct >= 5) {
    return {
      exitNow: true, reason: 'rsi_extreme_exhaustion',
      reasonAr: `إجهاد شرائي شديد (RSI ${rsiVal.toFixed(0)}) مع ربح +${unrealizedPnlPct.toFixed(1)}% → خروج فوري موصى به`,
      urgency: 'critical', newSl, trailingPhase: phase
    };
  }
  if (isBuy && rsiVal >= 75 && unrealizedPnlPct >= 3) {
    return {
      exitNow: false, reason: 'rsi_exhaustion_warning',
      reasonAr: `تحذير إجهاد (RSI ${rsiVal.toFixed(0)}): يُنصح بجني 50% من الأرباح عند +${unrealizedPnlPct.toFixed(1)}%`,
      urgency: 'high', newSl, trailingPhase: phase
    };
  }

  // ── MACD Dead Cross ───────────────────────────────────────────────────────
  if (deadCross && unrealizedPnlPct > 0) {
    return {
      exitNow: true, reason: 'macd_dead_cross',
      reasonAr: `تقاطع MACD سلبي مع ربح غير محقق +${unrealizedPnlPct.toFixed(1)}% → اخرج الآن قبل الانعكاس`,
      urgency: 'high', newSl, trailingPhase: phase
    };
  }
  if (deadCross && unrealizedPnlPct <= 0) {
    return {
      exitNow: false, reason: 'macd_dead_cross_loss',
      reasonAr: `تقاطع MACD سلبي مع خسارة ${unrealizedPnlPct.toFixed(1)}% → الصفقة في خطر`,
      urgency: 'medium', newSl, trailingPhase: phase
    };
  }

  // ── EMA20 Break ───────────────────────────────────────────────────────────
  if (ema20Brk && isBuy && unrealizedPnlPct > 0) {
    return {
      exitNow: true, reason: 'ema20_break',
      reasonAr: `كسر EMA20 بعد 3+ أيام صعود → اخرج بربح +${unrealizedPnlPct.toFixed(1)}% لحماية الصفقة`,
      urgency: 'high', newSl, trailingPhase: phase
    };
  }

  // ── Momentum Collapse (consecutive losing days) ───────────────────────────
  if (closes.length >= 4) {
    const last4 = closes.slice(-4);
    const down3 = last4.every((v, i) => i === 0 || v < last4[i - 1]);
    if (down3 && unrealizedPnlPct < -2 && isBuy) {
      return {
        exitNow: false, reason: 'momentum_collapse',
        reasonAr: `انهيار زخم: 3 جلسات هابطة متتالية مع خسارة ${unrealizedPnlPct.toFixed(1)}% → مراجعة فورية`,
        urgency: 'medium', newSl, trailingPhase: phase
      };
    }
  }

  // ── All clear – update trailing SL if changed ─────────────────────────────
  return {
    exitNow: false, reason: 'hold',
    reasonAr: trailingActive
      ? `الصفقة نشطة | وقف متحرك ${newSl.toFixed(2)} (${phase})`
      : 'الصفقة ضمن المعايير الطبيعية',
    urgency: 'none', newSl, trailingPhase: phase
  };
}

/**
 * CRON: /api/cron/track-recommended-trades
 * Runs every 30 minutes during EGX session (10:00–15:00 Cairo, Sun–Thu)
 *
 * Smart Dynamic Exit Engine:
 *  1. Trailing Stop (4 phases based on price vs TP levels)
 *  2. RSI Exhaustion exit (RSI > 75/80 with profit)
 *  3. MACD Dead Cross exit (histogram crosses below 0 while in profit)
 *  4. EMA20 Break exit (price falls below EMA20 after rally)
 *  5. Momentum Collapse warning (3 consecutive down days)
 *  6. Stale Trade Cleanup (28 days = 20 EGX trading days)
 *  7. Static TP1/TP2/SL (as before)
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
    tp1_hit:          0,
    tp2_hit:          0,
    sl_hit:           0,
    trailing_stop:    0,
    rsi_exit:         0,
    macd_exit:        0,
    ema20_exit:       0,
    dynamic_warnings: 0,
    trailing_updated: 0,
    backfill_fixed:   0,
    skipped_no_price: 0,
    stale_closed:     0,
  };

  try {
    // ── STEP 1: Backfill – fix closed trades missing pnl_percent ─────────────
    const { data: brokenClosed } = await sb
      .from('recommended_trades')
      .select('id, entry_price, exit_price, direction')
      .eq('status', 'closed')
      .not('exit_price', 'is', null)
      .is('pnl_percent', null)
      .limit(50);

    if (brokenClosed && brokenClosed.length > 0) {
      const fixes = brokenClosed.map((t: any) => {
        const entry = parseFloat(t.entry_price);
        const exit  = parseFloat(t.exit_price);
        const dir   = (t.direction || 'buy') !== 'sell' ? 1 : -1;
        const pnl   = parseFloat(((exit - entry) / entry * 100 * dir).toFixed(2));
        return Promise.resolve(
          sb.from('recommended_trades').update({ pnl_percent: pnl }).eq('id', t.id).then()
        );
      });
      await Promise.all(fixes);
      results.backfill_fixed = brokenClosed.length;
    }

    // ── STEP 2: Fetch active recommended trades ───────────────────────────────
    const { data: activeTrades, error: fetchErr } = await sb
      .from('recommended_trades')
      .select('id, company_id, symbol, direction, entry_price, tp1, tp2, sl, status, recommended_at, features_snapshot')
      .eq('status', 'active');

    if (fetchErr) throw fetchErr;
    if (!activeTrades || activeTrades.length === 0) {
      return NextResponse.json({ ...results, message: 'No active recommended trades' });
    }

    // ── STEP 2b: Stale Trade Cleanup (20+ trading days ≈ 28 calendar days) ───
    const STALE_DAYS = 28;
    const staleThreshold = new Date(Date.now() - STALE_DAYS * 86400000).toISOString();
    const staleTrades = activeTrades.filter(
      (t: any) => t.recommended_at && t.recommended_at < staleThreshold
    );

    if (staleTrades.length > 0) {
      const staleIds = staleTrades.map((t: any) => t.company_id);
      const { data: stalePrices } = await sb
        .from('market_prices').select('company_id, close_price')
        .in('company_id', staleIds).order('price_date', { ascending: false });

      const stalePriceMap: Record<string, number> = {};
      for (const p of (stalePrices ?? []) as any[]) {
        if (!stalePriceMap[p.company_id] && p.close_price)
          stalePriceMap[p.company_id] = parseFloat(p.close_price);
      }

      await Promise.all(staleTrades.map((t: any) => {
        const exitPrice = stalePriceMap[t.company_id] ?? parseFloat(t.entry_price);
        const dir = t.direction !== 'sell' ? 1 : -1;
        const pnl = parseFloat(((exitPrice - parseFloat(t.entry_price)) / parseFloat(t.entry_price) * 100 * dir).toFixed(2));
        return Promise.resolve(
          sb.from('recommended_trades').update({
            status: 'closed', exit_price: exitPrice,
            exit_reason: 'expired_no_movement', pnl_percent: pnl,
            closed_at: now.toISOString(),
          }).eq('id', t.id).then()
        );
      }));
      results.stale_closed = staleTrades.length;
    }

    const activeTradesToProcess = activeTrades.filter(
      (t: any) => !staleTrades.find((s: any) => s.id === t.id)
    );

    // ── STEP 3: Fetch candle history for dynamic exit computation ─────────────
    // We need 30 candles to compute RSI(14), MACD(26), EMA(20)
    const companyIds = [...new Set(activeTradesToProcess.map((t: any) => t.company_id))];
    const thirtyDaysAgo = new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0];

    const { data: candles } = await sb
      .from('market_prices')
      .select('company_id, close_price, price_date')
      .in('company_id', companyIds)
      .gte('price_date', thirtyDaysAgo)
      .order('price_date', { ascending: true });

    // Build candle history per company (sorted ascending = oldest first)
    const candleMap: Record<string, number[]> = {};
    for (const c of (candles ?? []) as any[]) {
      if (!candleMap[c.company_id]) candleMap[c.company_id] = [];
      if (c.close_price) candleMap[c.company_id].push(parseFloat(c.close_price));
    }

    // Latest price = last candle
    const priceMap: Record<string, number> = {};
    for (const [cid, arr] of Object.entries(candleMap)) {
      priceMap[cid] = arr[arr.length - 1];
    }

    // ── STEP 4: Dynamic exit evaluation ──────────────────────────────────────
    const updatePromises: Promise<any>[] = [];

    for (const trade of activeTradesToProcess as any[]) {
      const currentPrice = priceMap[trade.company_id];
      if (!currentPrice) { results.skipped_no_price++; continue; }

      const entry  = parseFloat(trade.entry_price);
      const tp1    = parseFloat(trade.tp1);
      const tp2    = parseFloat(trade.tp2);
      const sl     = parseFloat(trade.sl);
      const isBuy  = trade.direction !== 'sell';
      const snap   = trade.features_snapshot || {};

      // Track highest price since entry (stored in snapshot)
      const highestSinceEntry = Math.max(
        parseFloat(snap.highest_since_entry || entry),
        currentPrice
      );

      const calcPnl = (exit: number): number => {
        const dir = isBuy ? 1 : -1;
        return parseFloat(((exit - entry) / entry * 100 * dir).toFixed(2));
      };

      const unrealizedPnl = calcPnl(currentPrice);
      const closes        = candleMap[trade.company_id] ?? [];

      let update: Record<string, any> | null = null;

      // ── Static exits first (SL / TP1 / TP2) ───────────────────────────────
      if ((isBuy && currentPrice <= sl) || (!isBuy && currentPrice >= sl)) {
        update = {
          status: 'closed', exit_price: currentPrice,
          exit_reason: 'sl', pnl_percent: calcPnl(currentPrice),
          closed_at: now.toISOString(),
        };
        results.sl_hit++;
        // 🔔 Alert: SL hit
        dispatchExitSignal(sb, {
          trade_id: trade.id, symbol: trade.symbol,
          reason: 'sl', reason_ar: `وقف الخسارة مُفعَّل عند ${currentPrice.toFixed(2)} ج.م`,
          urgency: 'critical', pnl_pct: calcPnl(currentPrice), exit_price: currentPrice,
        }).catch(() => {});

      } else if ((isBuy && currentPrice >= tp2) || (!isBuy && currentPrice <= tp2)) {
        update = {
          status: 'closed', exit_price: currentPrice,
          exit_reason: 'tp2', pnl_percent: calcPnl(currentPrice),
          closed_at: now.toISOString(),
        };
        results.tp2_hit++;
        // 🔔 Alert: TP2 hit (great news!)
        dispatchExitSignal(sb, {
          trade_id: trade.id, symbol: trade.symbol,
          reason: 'tp2', reason_ar: `🎯🎯 الهدف الثاني محقق! ربح +${calcPnl(currentPrice).toFixed(1)}% عند ${currentPrice.toFixed(2)} ج.م`,
          urgency: 'high', pnl_pct: calcPnl(currentPrice), exit_price: currentPrice,
        }).catch(() => {});

      } else if ((isBuy && currentPrice >= tp1) || (!isBuy && currentPrice <= tp1)) {
        update = {
          status: 'tp1_hit',
          tp1_exit_price: currentPrice,
          pnl_percent: calcPnl(currentPrice),
          features_snapshot: { ...snap, highest_since_entry: highestSinceEntry, tp1_hit_at: now.toISOString() },
        };
        results.tp1_hit++;
        // 🔔 Alert: TP1 hit
        dispatchExitSignal(sb, {
          trade_id: trade.id, symbol: trade.symbol,
          reason: 'tp1', reason_ar: `🎯 الهدف الأول محقق عند ${currentPrice.toFixed(2)} ج.م (+${calcPnl(currentPrice).toFixed(1)}%) – SL تحرك لسعر الدخول`,
          urgency: 'high', pnl_pct: calcPnl(currentPrice), exit_price: currentPrice,
        }).catch(() => {});

      } else {
        // ── Dynamic Exit Engine ──────────────────────────────────────────────
        const exitEval = evaluateDynamicExit(
          closes, entry, tp1, tp2, sl, currentPrice,
          highestSinceEntry, isBuy, unrealizedPnl
        );

        if (exitEval.exitNow) {
          // Dynamic exit triggered
          update = {
            status: 'closed', exit_price: currentPrice,
            exit_reason: exitEval.reason,
            pnl_percent: calcPnl(currentPrice),
            closed_at: now.toISOString(),
            features_snapshot: {
              ...snap,
              dynamic_exit_reason_ar: exitEval.reasonAr,
              highest_since_entry: highestSinceEntry,
              trailing_phase: exitEval.trailingPhase,
            },
          };

          if (exitEval.reason === 'trailing_stop')        results.trailing_stop++;
          else if (exitEval.reason.startsWith('rsi'))     results.rsi_exit++;
          else if (exitEval.reason.startsWith('macd'))    results.macd_exit++;
          else if (exitEval.reason.startsWith('ema20'))   results.ema20_exit++;

          // 🔔 Alert: Dynamic exit (critical)
          dispatchExitSignal(sb, {
            trade_id: trade.id, symbol: trade.symbol,
            reason: exitEval.reason, reason_ar: exitEval.reasonAr,
            urgency: 'critical', pnl_pct: calcPnl(currentPrice),
            exit_price: currentPrice, new_sl: exitEval.newSl,
          }).catch(() => {});

        } else {
          // No exit – but update trailing SL if changed, and store highest price
          const slChanged = exitEval.newSl > sl + 0.001;
          const snapUpdate = {
            ...snap,
            highest_since_entry: highestSinceEntry,
            trailing_phase: exitEval.trailingPhase,
            dynamic_exit_signal: exitEval.reason !== 'hold' ? exitEval.reason : null,
            dynamic_exit_signal_ar: exitEval.reason !== 'hold' ? exitEval.reasonAr : null,
            dynamic_exit_urgency: exitEval.urgency,
            last_rsi: closes.length > 14 ? parseFloat(rsi(closes).toFixed(1)) : null,
            unrealized_pnl: unrealizedPnl,
          };

          update = { features_snapshot: snapUpdate, pnl_percent: unrealizedPnl };
          if (slChanged) {
            update.sl = parseFloat(exitEval.newSl.toFixed(4));
            results.trailing_updated++;
          }
          if (exitEval.urgency === 'high' || exitEval.urgency === 'medium') {
            results.dynamic_warnings++;
            // 🔔 Alert: Warning (high/medium urgency) – no auto-close, just notify
            dispatchExitSignal(sb, {
              trade_id: trade.id, symbol: trade.symbol,
              reason: exitEval.reason, reason_ar: exitEval.reasonAr,
              urgency: exitEval.urgency as any,
              pnl_pct: unrealizedPnl, new_sl: exitEval.newSl,
            }).catch(() => {});
          }
        }
      }

      if (update) {
        updatePromises.push(
          Promise.resolve(
            sb.from('recommended_trades').update(update).eq('id', trade.id).then()
          )
        );
      }
    }

    // ── STEP 5: Handle tp1_hit trades (Phase 2+) ─────────────────────────────
    const { data: tp1Trades } = await sb
      .from('recommended_trades')
      .select('id, company_id, direction, entry_price, tp1, tp2, sl, tp1_exit_price, features_snapshot')
      .eq('status', 'tp1_hit');

    for (const trade of (tp1Trades ?? []) as any[]) {
      const currentPrice = priceMap[trade.company_id];
      if (!currentPrice) continue;

      const entry       = parseFloat(trade.entry_price);
      const tp2         = parseFloat(trade.tp2);
      const tp1v        = parseFloat(trade.tp1);
      const sl          = parseFloat(trade.sl);
      const isBuy       = trade.direction !== 'sell';
      const snap        = trade.features_snapshot || {};
      const tp1Exit     = parseFloat(trade.tp1_exit_price || trade.tp1);
      const highestSince= Math.max(parseFloat(snap.highest_since_entry || entry), currentPrice);

      const calcBlendedPnl = (exit2: number): number => {
        const dir = isBuy ? 1 : -1;
        const p1  = (tp1Exit - entry) / entry * 100 * dir;
        const p2  = (exit2   - entry) / entry * 100 * dir;
        return parseFloat(((p1 * 0.5 + p2 * 0.5)).toFixed(2));
      };

      let update: Record<string, any> | null = null;

      if ((isBuy && currentPrice >= tp2) || (!isBuy && currentPrice <= tp2)) {
        update = {
          status: 'closed', exit_price: currentPrice,
          exit_reason: 'tp2', pnl_percent: calcBlendedPnl(currentPrice),
          closed_at: now.toISOString(),
        };
        results.tp2_hit++;

      } else if ((isBuy && currentPrice <= entry) || (!isBuy && currentPrice >= entry)) {
        // Break-even exit after TP1
        update = {
          status: 'closed', exit_price: entry,
          exit_reason: 'breakeven', pnl_percent: calcBlendedPnl(entry),
          closed_at: now.toISOString(),
        };
        results.sl_hit++;

      } else {
        // Dynamic exit for tp1_hit phase
        const closes   = candleMap[trade.company_id] ?? [];
        const unrealized = calcBlendedPnl(currentPrice);
        const exitEval = evaluateDynamicExit(
          closes, entry, tp1v, tp2, sl, currentPrice, highestSince, isBuy, unrealized
        );

        if (exitEval.exitNow) {
          update = {
            status: 'closed', exit_price: currentPrice,
            exit_reason: exitEval.reason,
            pnl_percent: calcBlendedPnl(currentPrice),
            closed_at: now.toISOString(),
            features_snapshot: { ...snap, dynamic_exit_reason_ar: exitEval.reasonAr, highest_since_entry: highestSince },
          };
          if (exitEval.reason === 'trailing_stop')      results.trailing_stop++;
          else if (exitEval.reason.startsWith('rsi'))   results.rsi_exit++;
          else if (exitEval.reason.startsWith('macd'))  results.macd_exit++;
        } else {
          const slChanged = exitEval.newSl > sl + 0.001;
          update = {
            features_snapshot: {
              ...snap,
              highest_since_entry: highestSince,
              trailing_phase: exitEval.trailingPhase,
              dynamic_exit_signal: exitEval.reason !== 'hold' ? exitEval.reason : null,
              dynamic_exit_signal_ar: exitEval.reason !== 'hold' ? exitEval.reasonAr : null,
              dynamic_exit_urgency: exitEval.urgency,
            },
            pnl_percent: unrealized,
          };
          if (slChanged) {
            update.sl = parseFloat(exitEval.newSl.toFixed(4));
            results.trailing_updated++;
          }
        }
      }

      if (update) {
        updatePromises.push(
          Promise.resolve(
            sb.from('recommended_trades').update(update).eq('id', trade.id).then()
          )
        );
      }
    }

    if (updatePromises.length > 0) await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      active_checked: activeTradesToProcess.length,
      ...results,
      dynamic_exit_summary: {
        trailing_stops_triggered: results.trailing_stop,
        rsi_exits: results.rsi_exit,
        macd_exits: results.macd_exit,
        ema20_exits: results.ema20_exit,
        trailing_sls_updated: results.trailing_updated,
        active_warnings: results.dynamic_warnings,
      }
    });

  } catch (error: any) {
    console.error('❌ track-recommended-trades cron failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
