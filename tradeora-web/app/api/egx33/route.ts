import { NextResponse } from 'next/server';

export const revalidate = 30; // 30 seconds cache for live index

export async function GET() {
  const providers: Record<string, { value: number; change: number }> = {};
  const values: number[] = [];
  const changes: number[] = [];

  // 1. Fetch TradingView Live Index
  try {
    const tvRes = await fetch('https://scanner.tradingview.com/egypt/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({
        symbols: { tickers: ['EGX:EGX33'] },
        columns: ['name', 'close', 'change']
      }),
      next: { revalidate: 30 }
    });
    if (tvRes.ok) {
      const tvData = await tvRes.json();
      const row = tvData?.data?.[0]?.d;
      if (row && row[1] != null) {
        const val = Number(row[1]);
        const chg = Number(row[2] ?? 0);
        providers.tradingview = { value: parseFloat(val.toFixed(2)), change: parseFloat(chg.toFixed(2)) };
        values.push(val);
        changes.push(chg);
      }
    }
  } catch (e) {
    console.warn('TradingView EGX33 fetch failed:', e);
  }

  // 2. Fetch Yahoo Finance Live Index fallback
  const yahooTickers = ['^EGX100EWI.CA', '^CASE30'];
  for (const ticker of yahooTickers) {
    if (providers.yahoo) break;
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 30 } });
      if (!res.ok) continue;
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter((c: any) => typeof c === 'number' && !isNaN(c));
      
      let latest: number | null = null;
      let prev: number | null = null;
      if (closes.length >= 2) {
        latest = closes[closes.length - 1];
        prev = closes[closes.length - 2];
      }

      if (latest !== null && prev !== null && prev > 0) {
        const chg = ((latest - prev) / prev) * 100;
        providers.yahoo = { value: parseFloat(latest.toFixed(2)), change: parseFloat(chg.toFixed(2)) };
        if (values.length === 0) {
          values.push(latest);
          changes.push(chg);
        }
      }
    } catch { continue; }
  }

  const avgValue = values.length > 0 ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null;
  const avgChange = changes.length > 0 ? parseFloat((changes.reduce((a, b) => a + b, 0) / changes.length).toFixed(2)) : null;

  return NextResponse.json({
    value: avgValue,
    change: avgChange,
    providersCount: Object.keys(providers).length,
    providers
  });
}
