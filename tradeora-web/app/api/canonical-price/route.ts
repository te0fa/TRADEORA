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
  'tradingview_30m',
  'tradingview_1h',
  'tradingview_4h',
  'tradingview_1d',
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const isIntraday = interval !== '1d';
  const table      = isIntraday ? 'intraday_snapshots' : 'market_prices';
  const dateCol    = isIntraday ? 'snapshot_time'      : 'price_date';
  const sources    = isIntraday
                     ? CANONICAL_SOURCES_INTRADAY
                     : CANONICAL_SOURCES_DAILY;
  
  const { data, error } = await sb
    .from(table)
    .select(`${dateCol}, open_price, high_price,
             low_price, close_price, volume, source`)
    .eq('company_id', companyId)
    .in('source', sources)
    .order(dateCol, { ascending: true })
    .limit(limit * 2);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Deduplication
  const dayMap = new Map<string, any>();
  for (const row of (data ?? [])) {
    const rawDate = (row as any)[dateCol] as string;
    const key = rawDate ? rawDate.slice(0, 10) : '';
    if (!dayMap.has(key)) {
      dayMap.set(key, row);
    } else {
      const currPri = sources.indexOf(dayMap.get(key).source);
      const newPri  = sources.indexOf(row.source);
      if (newPri < currPri) dayMap.set(key, row);
    }
  }
  
  // Clean candles
  const candles = Array.from(dayMap.values())
    .sort((a, b) => String((a as any)[dateCol]).localeCompare(String((b as any)[dateCol])))
    .filter(row => {
      const c = parseFloat(row.close_price ?? 0);
      const h = parseFloat(row.high_price  ?? 0);
      const l = parseFloat(row.low_price   ?? 0);
      return c > 0 && !(h === l && l === c) && h >= l;
    })
    .slice(-limit)
    .map(row => {
      const rDate = String((row as any)[dateCol] || '');
      return {
        time:   Math.floor(new Date(rDate).getTime() / 1000),
        date:   rDate.slice(0, 10),
        open:   parseFloat(row.open_price  ?? row.close_price),
        high:   parseFloat(row.high_price  ?? row.close_price),
        low:    parseFloat(row.low_price   ?? row.close_price),
        close:  parseFloat(row.close_price),
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
