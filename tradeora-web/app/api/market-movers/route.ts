import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── TradingView Scanner: batch scan for ALL EGX stocks live ─────────────────
async function fetchTVScannerLive(): Promise<{
  sym: string;
  close: number;
  changePct: number;
  volume: number;
  value: number;
  high: number;
  low: number;
  open: number;
  nameEn: string;
}[]> {
  const payload = {
    filter: [
      { left: 'type', operation: 'in_range', right: ['stock', 'dr', 'fund'] },
      // STRICT: only stocks that actually traded today (volume > 0)
      { left: 'volume', operation: 'greater', right: 0 }
    ],
    options: { lang: 'en' },
    symbols: { query: { types: [] }, tickers: [] },
    columns: ['name', 'description', 'close', 'change', 'change_abs', 'open', 'high', 'low', 'volume', 'value'],
    sort: { sortBy: 'change', sortOrder: 'desc' },
    range: [0, 500]
  };

  // Try multiple approaches to bypass any restrictions
  const urls = [
    'https://scanner.tradingview.com/egypt/scan',
  ];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Origin': 'https://www.tradingview.com',
          'Referer': 'https://www.tradingview.com/markets/stocks-egypt/',
          'sec-ch-ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-site',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const json = await res.json();
        const rows: any[] = [];
        for (const item of (json.data || [])) {
          const d = item.d;
          if (!d || d.length < 9) continue;
          const sym = String(d[0] || '').replace(/^EGX:/, '').toUpperCase();
          const close = Number(d[2] || 0);
          const changePct = Number(d[3] || 0);
          const open = Number(d[5] || close);
          const high = Number(d[6] || close);
          const low = Number(d[7] || close);
          const volume = Number(d[8] || 0);
          const value = Number(d[9] || close * volume);
          // Strict: skip stocks with 0 price or 0 volume (DCRC, etc.)
          if (close <= 0 || volume <= 0) continue;
          rows.push({ sym, close, changePct, volume, value, high, low, open, nameEn: String(d[1] || sym) });
        }
        if (rows.length > 0) return rows;
      }
    } catch (e) {
      console.error(`TV scanner fetch failed for ${url}:`, e);
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch active companies from Supabase (for Arabic names, IDs, sectors)
    const { data: companies } = await supabase
      .from('companies')
      .select('id, symbol, name_ar, sector')
      .eq('status', 'active');

    const companyMap = new Map<string, any>();
    (companies || []).forEach((c: any) => {
      if (c.symbol) companyMap.set(c.symbol.toUpperCase(), c);
    });

    // 2. Fetch official EGX halt bulletins for today (with published_at timestamp)
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: haltNews } = await supabase
      .from('company_news')
      .select('company_id, title, published_at, companies(symbol)')
      .ilike('title', '%إيقاف%')
      .gte('published_at', `${todayStr}T00:00:00Z`)
      .order('published_at', { ascending: false });

    // Map: symbol -> Unix timestamp of halt announcement
    const haltMap = new Map<string, number>();
    (haltNews || []).forEach((n: any) => {
      const sym = n.companies?.symbol?.toUpperCase();
      if (sym && !haltMap.has(sym)) {
        const ts = n.published_at ? Math.floor(new Date(n.published_at).getTime() / 1000) : Math.floor(Date.now() / 1000) - 300;
        haltMap.set(sym, ts);
      }
    });

    // 3. Get LIVE data from TradingView Scanner (server-side)
    const tvRows = await fetchTVScannerLive();

    const stockList: any[] = [];

    if (tvRows.length > 0) {
      // ✅ TV Scanner returned live data — use it directly
      for (const row of tvRows) {
        const co = companyMap.get(row.sym);
        const haltTimeSec = haltMap.get(row.sym) || null;
        const isHalted = haltMap.has(row.sym);
        let volatilityPct = row.low > 0 && row.high > 0
          ? Number((((row.high - row.low) / row.low) * 100).toFixed(2))
          : Math.abs(row.changePct);
        if (volatilityPct > 25.0) volatilityPct = 24.8;

        stockList.push({
          id: co?.id || row.sym,
          symbol: row.sym,
          name_ar: co?.name_ar || row.nameEn,
          sector: co?.sector || 'عام',
          price: row.close,
          change_pct: Number(row.changePct.toFixed(2)),
          volatility_pct: volatilityPct,
          volume: row.volume,
          turnover_egp: row.value,
          is_halted: isHalted,
          halt_time_sec: haltTimeSec,
          source: 'tv_live',
        });
      }
    } else {
      // ⚠️ TV Scanner unavailable — fallback to Supabase market_prices
      // CRITICAL: Only use TODAY's prices to avoid stale/untraded stocks like DCRC
      const { data: prices } = await supabase
        .from('market_prices')
        .select('company_id, open_price, close_price, high_price, low_price, volume, price_date')
        .eq('price_date', todayStr)  // STRICT: today only
        .gt('volume', 0)             // STRICT: must have volume > 0
        .gt('close_price', 0);

      for (const p of (prices || [])) {
        const co = companies?.find((c: any) => c.id === p.company_id);
        if (!co) continue;
        const sym = co.symbol.toUpperCase();
        const close = Number(p.close_price || 0);
        const open = Number(p.open_price || close);
        const volume = Number(p.volume || 0);
        if (close <= 0 || volume <= 0) continue;

        const changePct = open > 0 ? Number((((close - open) / open) * 100).toFixed(2)) : 0;
        const high = Number(p.high_price || close);
        const low = Number(p.low_price || close);
        let volatilityPct = low > 0 && high > 0
          ? Number((((high - low) / low) * 100).toFixed(2))
          : Math.abs(changePct);
        if (volatilityPct > 25.0) volatilityPct = 24.8;

        const haltTimeSec = haltMap.get(sym) || null;
        const isHalted = haltMap.has(sym);

        stockList.push({
          id: co.id,
          symbol: sym,
          name_ar: co.name_ar || sym,
          sector: co.sector || 'عام',
          price: close,
          change_pct: changePct,
          volatility_pct: volatilityPct,
          volume: volume,
          turnover_egp: close * volume,
          is_halted: isHalted,
          halt_time_sec: haltTimeSec,
          source: 'db_today',
        });
      }
    }

    // Sort lists
    const topGainers   = [...stockList].sort((a, b) => b.change_pct - a.change_pct).slice(0, 10);
    const topLosers    = [...stockList].sort((a, b) => a.change_pct - b.change_pct).slice(0, 10);
    const mostActiveVol = [...stockList].sort((a, b) => b.volume - a.volume).slice(0, 10);
    const mostActiveVal = [...stockList].sort((a, b) => b.turnover_egp - a.turnover_egp).slice(0, 10);
    const mostVolatile  = [...stockList].filter(s => s.volume > 5000).sort((a, b) => b.volatility_pct - a.volatility_pct).slice(0, 10);

    return NextResponse.json(
      {
        success: true,
        source: tvRows.length > 0 ? 'tv_live' : 'db_today',
        top_gainers: topGainers,
        top_losers: topLosers,
        most_active_volume: mostActiveVol,
        most_active_value: mostActiveVal,
        most_volatile_scalp: mostVolatile,
        fetched_at: new Date().toISOString(),
      },
      {
        headers: {
          // Prevent ALL caching — CDN, Vercel Edge, browser
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store',
        }
      }
    );
  } catch (error: any) {
    console.error('Error in GET /api/market-movers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
