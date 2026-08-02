import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TV_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Origin': 'https://www.tradingview.com',
  'Referer': 'https://www.tradingview.com/',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
};

// Try multiple known TradingView tickers for EGX33 Shariah index
const EGX33_TICKERS = ['EGX:EGX33', 'EGX:EGX33SHARIAH', 'EGX:EX33'];

async function fetchFromTradingViewScanner(): Promise<{ value: number; change: number } | null> {
  // Try each ticker until one returns valid data
  for (const ticker of EGX33_TICKERS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
        method: 'POST',
        headers: TV_HEADERS,
        body: JSON.stringify({
          symbols: { tickers: [ticker] },
          columns: ['close', 'change'],
        }),
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;
      const data = await res.json();
      const row = data?.data?.[0]?.d;
      if (row && row[0] != null && Number(row[0]) > 0) {
        return {
          value: parseFloat(Number(row[0]).toFixed(2)),
          change: parseFloat(Number(row[1] ?? 0).toFixed(2)),
        };
      }
    } catch { continue; }
  }
  return null;
}

async function fetchFromSupabaseCache(): Promise<{ value: number; change: number } | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return null;

    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(supabaseUrl, supabaseKey);
    const { data } = await sb
      .from('index_live_cache')
      .select('close_price, change_pct, updated_at')
      .eq('symbol', 'SHARIAH')
      .eq('exchange', 'EGX')
      .single();

    if (data?.close_price) {
      const ageMs = Date.now() - new Date(data.updated_at).getTime();
      // Only use cache if fresher than 5 minutes
      if (ageMs < 5 * 60 * 1000) {
        return {
          value: parseFloat(Number(data.close_price).toFixed(2)),
          change: parseFloat(Number(data.change_pct ?? 0).toFixed(2)),
        };
      }
    }
  } catch { /* silent */ }
  return null;
}

async function fetchFromMubasher(): Promise<{ value: number; change: number } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('https://www.mubasher.info/markets/EGX/indices/SHARIAH', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const html = await res.text();
    const priceMatch = html.match(/class="market-summary__last-price[^"]*">\s*([\d,.]+)/);
    const changeMatch = html.match(/class="market-summary__change-percentage[^"]*">\s*([-\d.%+]+)/);

    if (priceMatch && changeMatch) {
      const val = parseFloat(priceMatch[1].replace(/,/g, ''));
      const chg = parseFloat(changeMatch[1].replace(/%/g, ''));
      if (!isNaN(val) && !isNaN(chg) && val > 0) {
        return { value: parseFloat(val.toFixed(2)), change: parseFloat(chg.toFixed(2)) };
      }
    }
  } catch { /* silent */ }
  return null;
}

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET() {
  // 1. Try TradingView Scanner first (same source as EGX30 & EGX70)
  const tv = await fetchFromTradingViewScanner();
  if (tv) {
    return NextResponse.json(
      { value: tv.value, change: tv.change, source: 'tradingview_scanner' },
      { headers: NO_CACHE_HEADERS }
    );
  }

  // 2. Supabase fresh cache (< 5 min old)
  const cache = await fetchFromSupabaseCache();
  if (cache) {
    return NextResponse.json(
      { value: cache.value, change: cache.change, source: 'supabase_cache' },
      { headers: NO_CACHE_HEADERS }
    );
  }

  // 3. Mubasher scrape as last resort
  const mubasher = await fetchFromMubasher();
  if (mubasher) {
    return NextResponse.json(
      { value: mubasher.value, change: mubasher.change, source: 'mubasher' },
      { headers: NO_CACHE_HEADERS }
    );
  }

  return NextResponse.json(
    { error: 'EGX33 data unavailable from all sources', source: 'unavailable' },
    { status: 503, headers: NO_CACHE_HEADERS }
  );
}
