/**
 * /api/cron/sync-intraday
 * ========================
 * يعمل كل 15 دقيقة أثناء جلسة EGX (10:00 – 15:00 بتوقيت القاهرة، الأحد–الخميس)
 * يجلب شموع 15m من Yahoo Finance لكل الأسهم النشطة ويُخزنها في intraday_snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic    = 'force-dynamic';
export const maxDuration = 60;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL  || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
}

function getCairoTime(): { hour: number; day: number } {
  const now   = new Date();
  const cairo = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo', hour: 'numeric', weekday: 'short', hour12: false,
  }).formatToParts(now);
  const hour    = parseInt(cairo.find(p => p.type === 'hour')?.value ?? '0');
  const weekday = cairo.find(p => p.type === 'weekday')?.value ?? 'Mon';
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { hour, day: dayMap[weekday] ?? 1 };
}

async function fetchYahoo15m(ticker: string): Promise<any[] | null> {
  const YAHOO_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
  }
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=15m&range=5d&events=div,splits`
    const res = await fetch(url, { headers: YAHOO_HEADERS, next: { revalidate: 0 } })
    if (!res.ok) return null

    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result?.timestamp || !result?.indicators?.quote?.[0]) return null

    const timestamps: number[] = result.timestamp
    const quote = result.indicators.quote[0]
    const candles: any[] = []

    for (let i = 0; i < timestamps.length; i++) {
      const ts    = timestamps[i]
      const close = quote.close?.[i]
      if (!ts || !close || isNaN(close) || close <= 0) continue

      candles.push({
        time:   ts,
        open:   quote.open?.[i]   ?? close,
        high:   quote.high?.[i]   ?? close,
        low:    quote.low?.[i]    ?? close,
        close,
        volume: quote.volume?.[i] ?? 0,
      })
    }

    return candles.length > 0 ? candles : null
  } catch (e) {
    console.error(`[sync-intraday] Yahoo fetch error for ${ticker}:`, e)
    return null
  }
}


export async function GET(req: NextRequest) {
  // ── Security ───────────────────────────────────────────────────────────────
  const auth   = req.headers.get('Authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── EGX Session Gate ──────────────────────────────────────────────────────
  const { hour, day } = getCairoTime();
  const isWeekend = day === 5 || day === 6;
  const isSession = hour >= 10 && hour < 16;

  if (isWeekend || !isSession) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Market closed',
      cairo: { hour, day },
    });
  }

  const sb = getSupabase();

  // ── Fetch active companies ────────────────────────────────────────────────
  const { data: companies, error: compErr } = await sb
    .from('companies')
    .select('id, symbol')
    .eq('status', 'active')
    .order('symbol')
    .limit(150);

  if (compErr || !companies?.length) {
    return NextResponse.json({ success: false, error: compErr?.message ?? 'No companies' });
  }

  const results = { synced: 0, failed: 0, inserted: 0 };

  for (const company of companies) {
    const ticker = company.symbol.includes('.CA')
      ? company.symbol
      : `${company.symbol}.CA`;

    const candles = await fetchYahoo15m(ticker);
    if (!candles || candles.length === 0) {
      results.failed++;
      continue;
    }

    // ── Upsert recent candles (last 48 candles = last 12 hours of 15m data) ──
    const recent = candles.slice(-48);
    const rows = recent.map(c => ({
      company_id:    company.id,
      source:        'yahoo_15m',
      snapshot_time: new Date(c.time * 1000).toISOString(),
      price:         c.close,
      open_price:    c.open,
      high_price:    c.high,
      low_price:     c.low,
      volume:        c.volume,
    }));

    const { error: upsertErr } = await sb
      .from('intraday_snapshots')
      .upsert(rows, { onConflict: 'company_id,source,snapshot_time', ignoreDuplicates: true });

    if (upsertErr) {
      console.error(`[sync-intraday] Upsert error for ${company.symbol}:`, upsertErr.message);
      results.failed++;
    } else {
      results.synced++;
      results.inserted += rows.length;
    }

    // Throttle: small delay between companies to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  return NextResponse.json({
    success:  true,
    cairo:    { hour, day },
    companies_total: companies.length,
    ...results,
    timestamp: new Date().toISOString(),
  });
}
