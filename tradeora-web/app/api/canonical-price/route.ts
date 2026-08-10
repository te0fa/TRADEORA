import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// المصادر — نفس canonical.py بالضبط
const CANONICAL_SOURCES_DAILY = [
  'tradingview_1d',
  'egx_bulletin',
  'yahoo_historical',
  'tradingview',
  'yahoo_live',
];

const CANONICAL_SOURCES_INTRADAY = [
  'tradingview_15m',
  'yahoo_15m',
  'tradingview_30m',
  'yahoo_30m',
  'tradingview_1h',
  'yahoo_1h',
  'tradingview_4h',
  'yahoo_4h',
  'tradingview_5m',
  'yahoo_5m',
  'tradingview_1d',
  'yahoo_1d',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('company_id');
  const interval  = searchParams.get('interval') ?? '1d';
  const limit     = parseInt(searchParams.get('limit') ?? '300');
  
  if (!companyId) {
    return NextResponse.json(
      { error: 'company_id required' },
      { status: 400 }
    );
  }
  
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  );
  
  const isIntraday = interval !== '1d';
  const table      = isIntraday ? 'intraday_snapshots' : 'market_prices';
  const dateCol    = isIntraday ? 'snapshot_time'      : 'price_date';
  const exactTvSource = `tradingview_${interval}`;
  const exactYfSource = `yahoo_${interval}`;
  const sources    = isIntraday
                     ? [exactTvSource, exactYfSource, ...CANONICAL_SOURCES_INTRADAY.filter(s => s !== exactTvSource && s !== exactYfSource)]
                     : CANONICAL_SOURCES_DAILY;

  // For intraday: only fetch last 90 days to avoid stale snapshots from months ago
  const sinceDate = isIntraday
    ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  
  // For intraday_snapshots the close column is called "price" not "close_price"
  const selectCols = isIntraday
    ? `${dateCol}, open_price, high_price, low_price, price, volume, source`
    : `${dateCol}, open_price, high_price, low_price, close_price, volume, source`;

  let query = sb
    .from(table)
    .select(selectCols)
    .eq('company_id', companyId)
    .in('source', sources)
    .order(dateCol, { ascending: false })
    .limit(isIntraday ? limit * 6 : limit * 2);

  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Deduplication
  const dayMap = new Map<string, any>();
  for (const row of ((data as any[]) ?? [])) {
    const rawDate = row[dateCol] as string;
    if (!rawDate) continue;
    const key = isIntraday
      ? (rawDate.length >= 16 ? rawDate.slice(0, 16) : rawDate)
      : rawDate.slice(0, 10);
    if (!dayMap.has(key)) {
      dayMap.set(key, row);
    } else {
      const currPri = sources.indexOf(dayMap.get(key).source);
      const newPri  = sources.indexOf((row as any).source);
      if (newPri >= 0 && (currPri < 0 || newPri < currPri)) dayMap.set(key, row);
    }
  }
  
  // Normalize: intraday uses "price" as close; daily uses "close_price"
  const getClose = (row: any) => isIntraday
    ? parseFloat(row.price ?? row.close_price ?? 0)
    : parseFloat(row.close_price ?? row.price ?? 0);

  // Clean candles
  const candles = Array.from(dayMap.values())
    .sort((a, b) => String((a as any)[dateCol]).localeCompare(String((b as any)[dateCol])))
    .filter(row => {
      const c = getClose(row);
      const h = parseFloat(row.high_price  ?? 0);
      const l = parseFloat(row.low_price   ?? 0);
      return c > 0 && h >= l;
    })
    .slice(-limit)
    .map(row => {
      const rDate = String((row as any)[dateCol] || '');
      const closeVal = getClose(row);
      return {
        time:   Math.floor(new Date(rDate).getTime() / 1000),
        date:   isIntraday ? (rDate.length >= 16 ? rDate.slice(0, 16) : rDate) : rDate.slice(0, 10),
        open:   parseFloat(row.open_price  ?? closeVal),
        high:   parseFloat(row.high_price  ?? closeVal),
        low:    parseFloat(row.low_price   ?? closeVal),
        close:  closeVal,
        volume: parseInt(row.volume ?? 0),
        source: row.source,
      };
    });

  
  const sources_used = [...new Set(candles.map(c => c.source))];
  
  return NextResponse.json({
    candles,
    count:            candles.length,
    interval,
    sources_used,
    resolution:       'canonical_v1',
    updated_at:       new Date().toISOString(),
    last_candle_time: candles.length > 0
      ? candles[candles.length - 1].time * 1000
      : null,
  }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
