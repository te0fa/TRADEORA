import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

interface IndexData {
  value: number;
  change: number;
}

// Default fallback values (last known session close) if all remote endpoints timeout
const BASELINE_FALLBACKS: Record<string, IndexData> = {
  egx30:  { value: 54470.20, change: 0.34 },
  egx70:  { value: 19446.20, change: 2.16 },
  egx100: { value: 25434.70, change: 1.92 },
  egx33:  { value: 6199.67,  change: 0.46 },
};

async function fetchTVIndices(): Promise<Partial<Record<string, IndexData>>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://scanner.tradingview.com/egypt/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        symbols: { tickers: ['EGX:EGX30', 'EGX:EGX70EWI', 'EGX:EGX100EWI'] },
        columns: ['close', 'change'],
      }),
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return {};
    const data = await res.json();
    const rows = data?.data || [];

    const result: Partial<Record<string, IndexData>> = {};

    const r30  = rows.find((r: any) => r.s === 'EGX:EGX30')?.d;
    const r70  = rows.find((r: any) => r.s === 'EGX:EGX70EWI')?.d;
    const r100 = rows.find((r: any) => r.s === 'EGX:EGX100EWI')?.d;

    if (r30?.[0] != null)  result.egx30  = { value: parseFloat(Number(r30[0]).toFixed(2)),  change: parseFloat(Number(r30[1] ?? 0).toFixed(2)) };
    if (r70?.[0] != null)  result.egx70  = { value: parseFloat(Number(r70[0]).toFixed(2)),  change: parseFloat(Number(r70[1] ?? 0).toFixed(2)) };
    if (r100?.[0] != null) result.egx100 = { value: parseFloat(Number(r100[0]).toFixed(2)), change: parseFloat(Number(r100[1] ?? 0).toFixed(2)) };

    return result;
  } catch {
    return {};
  }
}

async function fetchEGX33(): Promise<IndexData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

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
    const priceMatch  = html.match(/class="market-summary__last-price[^"]*">\s*([\d,.]+)/);
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

export async function GET() {
  const [tvResults, egx33Result] = await Promise.all([
    fetchTVIndices(),
    fetchEGX33(),
  ]);

  const egx30  = tvResults.egx30  || BASELINE_FALLBACKS.egx30;
  const egx70  = tvResults.egx70  || BASELINE_FALLBACKS.egx70;
  const egx100 = tvResults.egx100 || BASELINE_FALLBACKS.egx100;
  const egx33  = egx33Result      || BASELINE_FALLBACKS.egx33;

  return NextResponse.json(
    {
      egx30,
      egx70,
      egx100,
      egx33,
      timestamp: Date.now(),
    },
    { headers: NO_CACHE_HEADERS }
  );
}
