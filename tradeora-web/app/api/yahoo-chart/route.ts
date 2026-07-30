import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const interval = searchParams.get('interval') || '1d';

  if (!ticker) {
    return NextResponse.json({ candles: [], error: 'Ticker is required' }, { status: 400 });
  }

  const rangeMap = {
    '1m':  '5d',
    '5m':  '1mo',
    '15m': '60d',
    '30m': '60d',
    '1h':  '60d',
    '4h':  '60d',
    '1d':  'max'
  };

  const range = rangeMap[interval as keyof typeof rangeMap] || 'max';
  let queryInterval = (interval === '4h' || interval === '1h') ? '60m' : interval;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache'
  };

  const fetchFromYahoo = async (symbolTicker: string, qInterval: string, qRange: string) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolTicker}?interval=${qInterval}&range=${qRange}&events=div,splits`;
    try {
      const res = await fetch(url, { headers, next: { revalidate: 30 } });
      if (!res.ok) return null;
      const data = await res.json();
      if (data?.chart?.result?.[0]?.timestamp) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  };

  try {
    let data = await fetchFromYahoo(ticker, queryInterval, range);

    // Fallback: If 1m or 5m returns few candles (< 15), fetch 15m instead
    if ((interval === '1m' || interval === '5m') && (!data || (data?.chart?.result?.[0]?.timestamp?.length || 0) < 15)) {
      const fallbackData = await fetchFromYahoo(ticker, '15m', '60d');
      if (fallbackData?.chart?.result?.[0]?.timestamp?.length) {
        data = fallbackData;
      }
    }

    if (!data) {
      if (ticker.endsWith('.CA')) {
        const rawTicker = ticker.slice(0, -3);
        data = await fetchFromYahoo(rawTicker, queryInterval, range);
      } else if (ticker.endsWith('.CAI')) {
        const rawTicker = ticker.slice(0, -4);
        data = await fetchFromYahoo(rawTicker, queryInterval, range);
      }
    }

    if (!data) {
      return NextResponse.json({ candles: [], error: 'no_data' }, { status: 200 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error proxying Yahoo Finance chart data:', error);
    return NextResponse.json({ candles: [], error: 'no_data' }, { status: 500 });
  }
}

