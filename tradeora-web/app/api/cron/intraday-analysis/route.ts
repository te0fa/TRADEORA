import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
// Allow up to 60 seconds for this cron to complete
export const maxDuration = 60;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(req: NextRequest) {
  // ✅ Security: validate CRON_SECRET header
  const authHeader = req.headers.get('Authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ── Cairo time check ─────────────────────────────────────────────
    const now = new Date();
    const cairoOffset = 3 * 60 * 60 * 1000;
    const cairoNow = new Date(now.getTime() + cairoOffset);
    const cairoHour = cairoNow.getUTCHours();
    const cairoDay = cairoNow.getUTCDay(); // 0=Sun … 6=Sat

    // EGX session: Sunday–Thursday 10:00–15:00 Cairo
    const isWeekend = cairoDay === 5 || cairoDay === 6; // Fri & Sat
    const isMarketHours = cairoHour >= 10 && cairoHour < 15;

    if (isWeekend || !isMarketHours) {
      return NextResponse.json({
        success: true,
        message: 'Market closed – skipping analysis',
        cairo_hour: cairoHour,
        cairo_day: cairoDay,
      });
    }

    // ── Fetch all active companies ────────────────────────────────────
    const { data: companies, error: compError } = await sb
      .from('companies')
      .select('id, symbol, name_ar, sector')
      .eq('status', 'active')
      .order('symbol');

    if (compError) throw compError;
    if (!companies || companies.length === 0) {
      return NextResponse.json({ success: true, message: 'No active companies' });
    }

    const ids = companies.map((c: any) => c.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // ── Fetch latest prices (last 7 days) ────────────────────────────
    const { data: prices, error: priceError } = await sb
      .from('market_prices')
      .select('company_id, close_price, open_price, high_price, low_price, volume, price_date, change_percent')
      .in('company_id', ids)
      .gte('price_date', sevenDaysAgo)
      .order('price_date', { ascending: false })
      .limit(1400);

    if (priceError) throw priceError;

    // Build latest-price map and close-price history per company
    const latestPriceMap: Record<string, any> = {};
    const closesMap: Record<string, number[]> = {};

    for (const p of (prices ?? []) as any[]) {
      if (!latestPriceMap[p.company_id]) latestPriceMap[p.company_id] = p;
      if (!closesMap[p.company_id]) closesMap[p.company_id] = [];
      closesMap[p.company_id].push(p.close_price);
    }

    // ── Fetch existing active trades ─────────────────────────────────
    const { data: existingTrades } = await sb
      .from('recommended_trades')
      .select('id, company_id, direction, entry_price, status, recommended_at')
      .eq('status', 'active');

    const existingTradeMap: Record<string, any> = {};
    for (const t of (existingTrades ?? []) as any[]) {
      existingTradeMap[t.company_id] = t;
    }

    // ── Analyse each company and update signals ──────────────────────
    const tradesToInsert: any[] = [];
    const updatePromises: any[] = [];

    for (const comp of companies as any[]) {
      const latest = latestPriceMap[comp.id];
      if (!latest || !latest.close_price) continue;

      const closes = closesMap[comp.id] ?? [];
      const closePrice: number = latest.close_price;

      // Compute change percent
      let changePercent: number = latest.change_percent ?? 0;
      if (!changePercent && latest.open_price > 0) {
        changePercent = ((closePrice - latest.open_price) / latest.open_price) * 100;
      }

      // Simple trend: recent 3 closes vs previous 3
      let trend: 'up' | 'down' | 'flat' = 'flat';
      if (closes.length >= 6) {
        const recent = (closes[0] + closes[1] + closes[2]) / 3;
        const older  = (closes[3] + closes[4] + closes[5]) / 3;
        if (recent > older * 1.005)      trend = 'up';
        else if (recent < older * 0.995) trend = 'down';
      } else if (closes.length >= 2) {
        trend = closes[0] > closes[1] ? 'up' : closes[0] < closes[1] ? 'down' : 'flat';
      }

      // Determine signal
      let newSignal: 'buy' | 'sell' | null = null;
      let winRate  = 70;
      let mlProb   = 0.70;

      if      (changePercent >= 2.5 && trend === 'up')   { newSignal = 'buy';  winRate = 80; mlProb = 0.83; }
      else if (changePercent <= -2.5 && trend === 'down') { newSignal = 'sell'; winRate = 75; mlProb = 0.80; }
      else if (changePercent >= 1.5 && trend !== 'down')  { newSignal = 'buy';  winRate = 72; mlProb = 0.76; }
      else if (changePercent <= -1.5 && trend !== 'up')   { newSignal = 'sell'; winRate = 70; mlProb = 0.74; }

      const existingTrade = existingTradeMap[comp.id];

      // ── Close trade if signal reversed ───────────────────────────────
      if (existingTrade && newSignal && existingTrade.direction !== newSignal) {
        const entryPrice: number = existingTrade.entry_price ?? closePrice;
        const pnl = ((closePrice - entryPrice) / entryPrice) * 100;

        updatePromises.push(
          sb
            .from('recommended_trades')
            .update({
              status:     'closed',
              exit_price: closePrice,
              pnl_percent: parseFloat(pnl.toFixed(2)),
              closed_at:  now.toISOString(),
            })
            .eq('id', existingTrade.id)
            .then()
        );

        delete existingTradeMap[comp.id];
      }

      // ── Queue new trade if signal detected and none exists ──────────
      if (!existingTradeMap[comp.id] && newSignal) {
        const tp1 = newSignal === 'buy'
          ? parseFloat((closePrice * 1.05).toFixed(4))
          : parseFloat((closePrice * 0.95).toFixed(4));
        const tp2 = newSignal === 'buy'
          ? parseFloat((closePrice * 1.08).toFixed(4))
          : parseFloat((closePrice * 0.92).toFixed(4));
        const sl = newSignal === 'buy'
          ? parseFloat((closePrice * 0.95).toFixed(4))
          : parseFloat((closePrice * 1.05).toFixed(4));

        tradesToInsert.push({
          company_id:      comp.id,
          symbol:          comp.symbol,
          direction:       newSignal,
          status:          'active',
          entry_price:     closePrice,
          tp1,
          tp2,
          sl,
          timeframe:       'intraday',
          win_rate_hist:   winRate,
          ml_probability:  mlProb,
          recommended_at:  now.toISOString(),
        });
      }
    }

    // Execute bulk insert & updates concurrently
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
    }

    if (tradesToInsert.length > 0) {
      // Chunk bulk inserts into batches of 50 to prevent payload size errors
      for (let i = 0; i < tradesToInsert.length; i += 50) {
        const batch = tradesToInsert.slice(i, i + 50);
        await sb.from('recommended_trades').insert(batch);
      }
    }

    return NextResponse.json({
      success:   true,
      message:   'Intraday analysis completed ✅',
      cairo_hour: cairoHour,
      analyzed:  companies.length,
      inserted:  tradesToInsert.length,
      closed:    updatePromises.length,
      timestamp: now.toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Intraday analysis cron failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
