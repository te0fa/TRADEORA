import { NextResponse } from 'next/server';
export const revalidate = 60; // cache لمدة 60 ثانية

export async function GET() {
  const tickers = ['^SHARIAH.CA', '^EGX33.CA', '^EGX33', 'EGX33.CA', '^EGX33SHAR.CA'];
  for (const ticker of tickers) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
      const res = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 60 }
      });
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const closes = result?.indicators?.quote?.[0]?.close ?? [];
      const valid = closes.filter((c: any): c is number => typeof c === 'number' && !isNaN(c));

      let latest: number | null = null;
      let prev: number | null = null;

      if (valid.length >= 2) {
        latest = valid[valid.length - 1];
        prev   = valid[valid.length - 2];
      } else if (valid.length === 1 && result?.meta?.chartPreviousClose) {
        latest = valid[0];
        prev   = result.meta.chartPreviousClose;
      } else if (result?.meta?.regularMarketPrice && result?.meta?.chartPreviousClose) {
        latest = result.meta.regularMarketPrice;
        prev   = result.meta.chartPreviousClose;
      }

      if (latest !== null && prev !== null && prev > 0) {
        return NextResponse.json({
          value: parseFloat(latest.toFixed(2)),
          change: parseFloat(((latest - prev) / prev * 100).toFixed(2))
        });
      }
    } catch { continue; }
  }
  return NextResponse.json({ value: null, change: null });
}
