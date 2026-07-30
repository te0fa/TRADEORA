import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol')?.toUpperCase() || 'AMOC';

  try {
    const tvSymbol = `EGX:${symbol}`;
    const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://www.tradingview.com',
        'Referer': 'https://www.tradingview.com/'
      },
      body: JSON.stringify({
        symbols: { tickers: [tvSymbol] },
        columns: ['close', 'change', 'change_abs', 'open', 'high', 'low', 'volume']
      }),

      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`TradingView scanner responded with status ${res.status}`);
    }

    const data = await res.json();
    const row = data?.data?.[0]?.d;

    if (row && row[0] != null) {
      const close = parseFloat(Number(row[0]).toFixed(3));
      const changePct = parseFloat(Number(row[1] ?? 0).toFixed(2));
      const changeAbs = parseFloat(Number(row[2] ?? 0).toFixed(3));
      const open = parseFloat(Number(row[3] ?? close).toFixed(3));
      const high = parseFloat(Number(row[4] ?? close).toFixed(3));
      const low = parseFloat(Number(row[5] ?? close).toFixed(3));
      const volume = Number(row[6] ?? 0);

      return NextResponse.json(
        {
          symbol,
          close,
          changePct,
          changeAbs,
          open,
          high,
          low,
          volume,
          updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          source: 'tradingview_scanner'
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    return NextResponse.json({ error: 'No live ticker data found for symbol' }, { status: 444 });
  } catch (err: any) {
    console.error('Error fetching live stock tick:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch live stock tick' }, { status: 500 });
  }
}
