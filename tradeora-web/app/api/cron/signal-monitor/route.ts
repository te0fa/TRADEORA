/**
 * /api/cron/signal-monitor
 * ========================
 * يُشغَّل كل 15 دقيقة أثناء جلسة EGX (10:00 – 15:00 بتوقيت القاهرة)
 * المهمة: رصد تغيرات جوهرية في التوصيات وإرسال تنبيهات فورية
 *
 * يُشغَّل من: Vercel Cron (vercel.json) أو أي cron scheduler
 * Authorization: Bearer ${CRON_SECRET}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dispatchTradeAlert } from '@/lib/alert-dispatcher';

export const dynamic   = 'force-dynamic';
export const maxDuration = 60;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

/** Cairo time helpers */
function getCairoTime(): { hour: number; minute: number; day: number } {
  const now     = new Date();
  const cairo   = new Date(now.getTime() + 3 * 3600 * 1000);
  return {
    hour:   cairo.getUTCHours(),
    minute: cairo.getUTCMinutes(),
    day:    cairo.getUTCDay(),   // 0=Sun … 6=Sat
  };
}

function isEGXSessionOpen(): boolean {
  const { hour, day } = getCairoTime();
  const isWeekend = day === 5 || day === 6;           // Fri & Sat
  const isMarket  = hour >= 10 && hour < 15;
  return !isWeekend && isMarket;
}

/** Check if price moved significantly (>= threshold %) vs stored snapshot */
function priceChangedSignificantly(current: number, snapshot: number, thresholdPct = 1.5): boolean {
  if (!snapshot || snapshot === 0) return false;
  return Math.abs((current - snapshot) / snapshot) * 100 >= thresholdPct;
}

/** Compute a simple urgency score from price change % */
function getUrgency(changePct: number): 'critical' | 'high' | 'medium' | 'low' {
  const abs = Math.abs(changePct);
  if (abs >= 5)  return 'critical';
  if (abs >= 3)  return 'high';
  if (abs >= 1.5) return 'medium';
  return 'low';
}

export async function GET(req: NextRequest) {
  // ── Security check ────────────────────────────────────────────────
  const authHeader    = req.headers.get('Authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Market hours gate ─────────────────────────────────────────────
  if (!isEGXSessionOpen()) {
    const t = getCairoTime();
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Market closed or weekend',
      cairo: t,
    });
  }

  const sb = getSupabase();
  const results: any[] = [];
  let alertsSent = 0;

  try {
    // ── 1. Fetch active recommended trades ───────────────────────────
    const { data: trades, error: tradesErr } = await sb
      .from('recommended_trades')
      .select(`
        id,
        symbol,
        company_id,
        entry_price,
        current_price,
        stop_loss,
        target1,
        target2,
        target3,
        score,
        signal,
        updated_at,
        user_id,
        trade_type
      `)
      .in('signal', ['BUY', 'STRONG_BUY', 'SELL', 'STRONG_SELL'])
      .order('updated_at', { ascending: false })
      .limit(200);

    if (tradesErr) throw tradesErr;
    if (!trades || trades.length === 0) {
      return NextResponse.json({ success: true, trades_checked: 0, alerts_sent: 0, message: 'No active trades' });
    }

    // ── 2. Fetch latest live prices for these companies ──────────────
    const companyIds = [...new Set((trades as any[]).map(t => t.company_id).filter(Boolean))];
    const symbolList = [...new Set((trades as any[]).map(t => t.symbol).filter(Boolean))];

    // Try live_ticks first for real-time prices
    const { data: liveTicks } = await sb
      .from('live_ticks')
      .select('symbol, close_price, change_percent, updated_at')
      .in('symbol', symbolList)
      .order('updated_at', { ascending: false });

    // Build price map: symbol → latest price
    const priceMap: Record<string, { price: number; changePct: number }> = {};
    for (const tick of (liveTicks ?? []) as any[]) {
      if (!priceMap[tick.symbol]) {
        priceMap[tick.symbol] = {
          price:     tick.close_price,
          changePct: tick.change_percent ?? 0,
        };
      }
    }

    // Fallback: market_prices for any symbols without live tick
    const missingSymbols = symbolList.filter(s => !priceMap[s]);
    if (missingSymbols.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const { data: mPrices } = await sb
        .from('market_prices')
        .select('company_id, close_price, change_percent')
        .in('company_id', companyIds)
        .eq('price_date', today);

      for (const p of (mPrices ?? []) as any[]) {
        // Map company_id back to symbol
        const trade = (trades as any[]).find(t => t.company_id === p.company_id);
        if (trade && !priceMap[trade.symbol]) {
          priceMap[trade.symbol] = {
            price:     p.close_price,
            changePct: p.change_percent ?? 0,
          };
        }
      }
    }

    // ── 3. Fetch last alert snapshots (to avoid repeated alerts) ─────
    const tradeIds = (trades as any[]).map(t => t.id);
    const { data: lastAlerts } = await sb
      .from('trade_alert_snapshots')
      .select('trade_id, snapshotted_price, alerted_at')
      .in('trade_id', tradeIds);

    const snapshotMap: Record<string, { price: number; alertedAt: string }> = {};
    for (const snap of (lastAlerts ?? []) as any[]) {
      snapshotMap[snap.trade_id] = {
        price:     snap.snapshotted_price,
        alertedAt: snap.alerted_at,
      };
    }

    // ── 4. Evaluate each trade ────────────────────────────────────────
    for (const trade of trades as any[]) {
      const liveData = priceMap[trade.symbol];
      if (!liveData) continue;

      const { price: livePrice, changePct } = liveData;
      const snapshot  = snapshotMap[trade.id];
      const lastPrice = snapshot?.price ?? trade.entry_price;

      // Skip if last alert was < 14 min ago (prevent spam)
      if (snapshot?.alertedAt) {
        const elapsed = Date.now() - new Date(snapshot.alertedAt).getTime();
        if (elapsed < 14 * 60 * 1000) continue;
      }

      // Check if price moved significantly since last snapshot
      if (!priceChangedSignificantly(livePrice, lastPrice)) continue;

      const movePct   = ((livePrice - lastPrice) / lastPrice) * 100;
      const urgency   = getUrgency(changePct !== 0 ? changePct : movePct);

      // ── Determine alert type ──────────────────────────────────────
      let reasonKey = 'price_move';
      let reasonAr  = `تحرك سعري ${movePct >= 0 ? 'صاعد' : 'هابط'}: ${Math.abs(movePct).toFixed(1)}%`;

      const stoplossHit     = trade.stop_loss  && livePrice <= trade.stop_loss;
      const target1Hit      = trade.target1     && livePrice >= trade.target1;
      const target2Hit      = trade.target2     && livePrice >= trade.target2;
      const target3Hit      = trade.target3     && livePrice >= trade.target3;

      if (stoplossHit) {
        reasonKey = 'stop_loss_hit';
        reasonAr  = `⛔ وقف الخسارة لُمس! السعر ${livePrice.toFixed(3)} — SL: ${trade.stop_loss?.toFixed(3)}`;
      } else if (target3Hit) {
        reasonKey = 'target3_hit';
        reasonAr  = `🏆 الهدف الثالث تحقق! السعر ${livePrice.toFixed(3)} ≥ T3: ${trade.target3?.toFixed(3)} — ربح استثنائي`;
      } else if (target2Hit) {
        reasonKey = 'target2_hit';
        reasonAr  = `🎯 الهدف الثاني تحقق! السعر ${livePrice.toFixed(3)} ≥ T2: ${trade.target2?.toFixed(3)}`;
      } else if (target1Hit) {
        reasonKey = 'target1_hit';
        reasonAr  = `✅ الهدف الأول تحقق! السعر ${livePrice.toFixed(3)} ≥ T1: ${trade.target1?.toFixed(3)} — فكر في تأمين أرباح جزئية`;
      } else if (Math.abs(movePct) >= 5) {
        reasonKey = 'sharp_move';
        reasonAr  = `🚨 تحرك حاد ${movePct >= 0 ? 'صاعد' : 'هابط'} ${Math.abs(movePct).toFixed(1)}% في ${trade.symbol}`;
      }

      const pnlPct = trade.entry_price
        ? ((livePrice - trade.entry_price) / trade.entry_price) * 100
        : 0;

      // ── Dispatch alert ────────────────────────────────────────────
      try {
        await dispatchTradeAlert(sb, {
          trade_id:    trade.id,
          symbol:      trade.symbol,
          reason:      reasonKey,
          reason_ar:   reasonAr,
          urgency,
          pnl_pct:     pnlPct,
          exit_price:  livePrice,
          new_sl:      trade.stop_loss,
          user_ids:    trade.user_id ? [trade.user_id] : [],
        });
        alertsSent++;
      } catch (alertErr) {
        console.error(`[signal-monitor] Alert dispatch failed for ${trade.symbol}:`, alertErr);
      }

      // ── Update snapshot ───────────────────────────────────────────
      await sb.from('trade_alert_snapshots').upsert({
        trade_id:         trade.id,
        snapshotted_price: livePrice,
        alerted_at:       new Date().toISOString(),
        alert_reason:     reasonKey,
      }, { onConflict: 'trade_id' });

      results.push({
        symbol:     trade.symbol,
        reason:     reasonKey,
        livePrice,
        movePct:    movePct.toFixed(2),
        urgency,
        pnlPct:     pnlPct.toFixed(2),
      });
    }

    return NextResponse.json({
      success:       true,
      trades_checked: trades.length,
      alerts_sent:   alertsSent,
      triggered:     results,
      timestamp:     new Date().toISOString(),
    });

  } catch (err: any) {
    console.error('[signal-monitor] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
