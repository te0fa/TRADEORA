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

export async function GET() {
  // 1. TradingView — Primary source (EGX:EGX33 = EGX Shariah Index)
  const tv = await fetchFromTradingView('EGX:EGX33');
  if (tv) {
    return NextResponse.json({ value: tv.value, change: tv.change, source: 'tradingview' });
  }

  // 2. No reliable Yahoo ticker for EGX33 Shariah — return unavailable
  return NextResponse.json({ value: null, change: null, source: 'unavailable' });
}
