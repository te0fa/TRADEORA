/**
 * /api/cron/sync-intraday
 * ========================
 * يعمل كل 15 دقيقة أثناء جلسة EGX (10:00 – 15:00 بتوقيت القاهرة، الأحد–الخميس)
 * يجلب شموع وفترات التداول اللحظية المباشرة من TradingView Scanner
 * لكل الأسهم النشطة ويُخزنها في intraday_snapshots تحت المصدر tradingview_15m
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
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    hour: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now);

  const hourStr = parts.find(p => p.type === 'hour')?.value ?? '0';
  const weekday = parts.find(p => p.type === 'weekday')?.value ?? 'Mon';
  const parsedHour = parseInt(hourStr, 10);
  const hour = parsedHour === 24 ? 0 : parsedHour;

  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { hour, day: dayMap[weekday] ?? 1 };
}

interface TVScanRow {
  s: string;
  d: (number | string | null)[];
}

async function fetchTradingViewScan(): Promise<TVScanRow[]> {
  const url = 'https://scanner.tradingview.com/egypt/scan';
  const body = {
    filter: [],
    options: { lang: 'en' },
    markets: ['egypt'],
    symbols: { query: { types: [] }, tickers: [] },
    columns: [
      'name',
      'description',
      'open',
      'high',
      'low',
      'close',
      'volume',
      'Value.Traded',
      'change',
      'change_abs',
      'close[1]'
    ],
    sort: { sortBy: 'name', sortOrder: 'asc' },
    range: [0, 1000]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data?.data ?? [];
  } catch (err) {
    console.error('[sync-intraday] TradingView scanner fetch error:', err);
    return [];
  }
}

export async function GET(req: NextRequest) {
  // ── Security ───────────────────────────────────────────────────────────────
  const auth   = req.headers.get('Authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';

  // ── EGX Session Gate ──────────────────────────────────────────────────────
  const { hour, day } = getCairoTime();
  const isWeekend = day === 5 || day === 6;
  const isSession = hour >= 10 && hour < 16;

  if (!force && (isWeekend || !isSession)) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'Market closed',
      cairo: { hour, day },
    });
  }

  const sb = getSupabase();

  // ── Fetch active companies mapping ────────────────────────────────────────
  const { data: companies, error: compErr } = await sb
    .from('companies')
    .select('id, symbol')
    .eq('status', 'active');

  if (compErr || !companies?.length) {
    return NextResponse.json({ success: false, error: compErr?.message ?? 'No companies' });
  }

  const symbolMap = new Map<string, string>();
  for (const c of companies) {
    const cleanSym = c.symbol.split('.')[0].toUpperCase();
    symbolMap.set(cleanSym, c.id);
  }

  // ── Fetch live intraday snapshot from TradingView ────────────────────────
  const tvRows = await fetchTradingViewScan();
  if (!tvRows || tvRows.length === 0) {
    return NextResponse.json({ success: false, error: 'Failed to fetch TradingView scanner data' });
  }

  // Align timestamp to 15-minute boundary in ISO format
  const now = new Date();
  const cairoTimeStr = now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
  const cairoDate = new Date(cairoTimeStr);
  const minutes15 = Math.floor(cairoDate.getMinutes() / 15) * 15;
  cairoDate.setMinutes(minutes15, 0, 0);

  // Convert Cairo aligned date to UTC ISO string
  const snapshot_time = now.toISOString();

  const dbPayloads: any[] = [];

  for (const row of tvRows) {
    const rawTicker = row.s; // e.g. "EGX:COMI"
    if (!rawTicker || !rawTicker.includes(':')) continue;
    const ticker = rawTicker.split(':')[1].toUpperCase();

    const companyId = symbolMap.get(ticker);
    if (!companyId) continue;

    const d = row.d;
    const open_price = parseFloat(String(d[2] ?? 0));
    const high_price = parseFloat(String(d[3] ?? 0));
    const low_price  = parseFloat(String(d[4] ?? 0));
    const price      = parseFloat(String(d[5] ?? 0));
    const volume     = parseInt(String(d[6] ?? 0), 10);

    if (price <= 0 || isNaN(price)) continue;

    dbPayloads.push({
      company_id: companyId,
      source: 'tradingview_15m',
      snapshot_time,
      price,
      open_price: open_price > 0 ? open_price : price,
      high_price: high_price > 0 ? high_price : price,
      low_price: low_price > 0 ? low_price : price,
      volume: isNaN(volume) ? 0 : volume,
    });
  }

  if (dbPayloads.length === 0) {
    return NextResponse.json({ success: false, error: 'No valid candles parsed' });
  }

  // Upsert in batches of 100
  let inserted = 0;
  for (let i = 0; i < dbPayloads.length; i += 100) {
    const chunk = dbPayloads.slice(i, i + 100);
    const { error: upsertErr } = await sb
      .from('intraday_snapshots')
      .upsert(chunk, { onConflict: 'company_id,snapshot_time,source' });

    if (upsertErr) {
      console.error('[sync-intraday] Upsert error:', upsertErr.message);
    } else {
      inserted += chunk.length;
    }
  }

  return NextResponse.json({
    success: true,
    cairo: { hour, day },
    companies_total: companies.length,
    scraped_total: tvRows.length,
    inserted_candles: inserted,
    timestamp: snapshot_time,
  });
}
