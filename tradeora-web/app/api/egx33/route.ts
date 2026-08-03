import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function fetchFromMubasher(): Promise<{ value: number; change: number } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://www.mubasher.info/markets/EGX/indices/SHARIAH', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
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
      .maybeSingle();

    if (data?.close_price) {
      return {
        value: parseFloat(Number(data.close_price).toFixed(2)),
        change: parseFloat(Number(data.change_pct ?? 0).toFixed(2)),
      };
    }
  } catch { /* silent */ }
  return null;
}

export async function GET() {
  // 1. Try Mubasher scrape (fast & accurate for EGX33 Shariah)
  const mubasher = await fetchFromMubasher();
  if (mubasher) {
    return NextResponse.json(
      { value: mubasher.value, change: mubasher.change, source: 'mubasher' },
      { headers: NO_CACHE_HEADERS }
    );
  }

  // 2. Try Supabase cache
  const cache = await fetchFromSupabaseCache();
  if (cache) {
    return NextResponse.json(
      { value: cache.value, change: cache.change, source: 'supabase_cache' },
      { headers: NO_CACHE_HEADERS }
    );
  }

  // 3. Known baseline estimate for EGX 33 Shariah index
  return NextResponse.json(
    { value: 6213.36, change: 0.68, source: 'estimate' },
    { headers: NO_CACHE_HEADERS }
  );
}
