import { NextResponse } from 'next/server';

export const revalidate = 10;

const TV_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Origin': 'https://www.tradingview.com',
  'Referer': 'https://www.tradingview.com/',
};

async function fetchFromTradingView(ticker: string): Promise<{ value: number; change: number } | null> {
  try {
    const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
      method: 'POST',
      headers: TV_HEADERS,
      body: JSON.stringify({
        symbols: { tickers: [ticker] },
        columns: ['close', 'change'],
      }),
      next: { revalidate: 10 },
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

async function fetchFromYahoo(tickers: string[]): Promise<{ value: number; change: number } | null> {
  for (const ticker of tickers) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 10 },
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
  // 1. TradingView — Primary source
  const tv = await fetchFromTradingView('EGX:EGX70');
  if (tv) {
    return NextResponse.json({ value: tv.value, change: tv.change, source: 'tradingview' });
  }

  // 2. Yahoo Finance — Fallback (EGX70 EWI)
  const yahoo = await fetchFromYahoo(['^EGX70EWI.CA', '^EGX70.CA']);
  if (yahoo) {
    return NextResponse.json({ value: yahoo.value, change: yahoo.change, source: 'yahoo' });
  }

  // 3. No data available
  return NextResponse.json({ value: null, change: null, source: 'unavailable' });
}
