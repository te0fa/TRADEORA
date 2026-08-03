import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TV_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Origin': 'https://www.tradingview.com',
  'Referer': 'https://www.tradingview.com/',
};

async function fetchFromTradingView(): Promise<{ value: number; change: number } | null> {
  try {
    const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
      method: 'POST',
      headers: TV_HEADERS,
      body: JSON.stringify({
        symbols: { tickers: ['EGX:EGX100EWI'] },
        columns: ['close', 'change'],
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    const row = data?.data?.[0]?.d;
    if (row && row[0] != null) {
      return {
        value: parseFloat(Number(row[0]).toFixed(2)),
        change: parseFloat(Number(row[1] ?? 0).toFixed(2)),
      };
    }
  } catch { /* silent */ }
  return null;
}

async function fetchFromYahoo(): Promise<{ value: number; change: number } | null> {
  const yahooTickers = ['^EGX100EWI.CA', '^EGX100.CA', 'EGX100.CA'];
  for (const ticker of yahooTickers) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];

      let latest: number | null = null;
      let prev: number | null = null;

      const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter(
        (c: unknown) => typeof c === 'number' && !isNaN(c as number)
      );
      if (closes.length >= 2) {
        latest = closes[closes.length - 1];
        prev = closes[closes.length - 2];
      } else if (result?.meta?.regularMarketPrice && result?.meta?.chartPreviousClose) {
        latest = result.meta.regularMarketPrice;
        prev = result.meta.chartPreviousClose;
      }

      if (latest !== null && prev !== null && prev > 0) {
        const chg = ((latest - prev) / prev) * 100;
        return {
          value: parseFloat(latest.toFixed(2)),
          change: parseFloat(chg.toFixed(2)),
        };
      }
    } catch { continue; }
  }
  return null;
}

export async function GET() {
  const tv = await fetchFromTradingView();
  if (tv) {
    return NextResponse.json(
      { value: tv.value, change: tv.change, source: 'tradingview' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  const yahoo = await fetchFromYahoo();
  if (yahoo) {
    return NextResponse.json(
      { value: yahoo.value, change: yahoo.change, source: 'yahoo' },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  return NextResponse.json(
    { value: 25449.9, change: 1.98, source: 'estimate' },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}
