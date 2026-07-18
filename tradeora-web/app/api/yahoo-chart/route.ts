import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const interval = searchParams.get('interval') || '1d';

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  // Yahoo Finance supported ranges per interval:
  // 15m → max 7 days | 30m → max 60 days | 60m → max 730 days | 1d → max
  const rangeMap = {
    '15m': '5d',    // Yahoo only supports up to 7d for 15m — use 5d to be safe
    '30m': '5d',    // 30m also limited; 60d would silently return daily data
    '1h':  '60d',   // 60m data up to 60 days
    '4h':  '60d',   // 60m data fetched up to 60 days (manually aggregated)
    '1d':  'max'    // daily data up to max history
  };

  const range = rangeMap[interval as keyof typeof rangeMap] || 'max';
  const queryInterval = (interval === '4h' || interval === '1h') ? '60m' : interval;
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${queryInterval}&range=${range}`;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache'
  };

  try {
    let res = await fetch(url, { headers, next: { revalidate: 30 } });
    let hasData = false;
    let data: any = null;

    if (res.ok) {
      data = await res.json();
      if (data?.chart?.result?.[0]?.timestamp) {
        hasData = true;
      }
    }

    // Ticker Fallback: if CA ticker failed or returned empty, try without CA suffix
    if (!hasData && ticker.endsWith('.CA')) {
      const fallbackTicker = ticker.slice(0, -3);
      console.log(`Primary CA ticker ${ticker} empty/failed. Trying fallback: ${fallbackTicker}`);
      const fallbackUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${fallbackTicker}?interval=${queryInterval}&range=${range}`;
      
      const resFb = await fetch(fallbackUrl, { headers, next: { revalidate: 30 } });
      if (resFb.ok) {
        const dataFb = await resFb.json();
        if (dataFb?.chart?.result?.[0]?.timestamp) {
          data = dataFb;
          hasData = true;
        }
      }
    }

    if (!hasData) {
      return NextResponse.json({ error: 'No chart data found for this ticker' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying Yahoo Finance chart data:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
