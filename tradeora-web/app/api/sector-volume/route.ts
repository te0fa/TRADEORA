import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function getRollingMean(values: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    result.push(sum / slice.length);
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId parameter' }, { status: 400 });
    }

    // 1. Get company's sector
    const { data: company, error: compError } = await supabase
      .from('companies')
      .select('sector')
      .eq('id', companyId)
      .single();

    if (compError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const sector = company.sector;
    if (!sector) {
      return NextResponse.json({ error: 'Company does not have a sector' }, { status: 400 });
    }

    // 2. Get all companies in this sector
    const { data: companies, error: sectorError } = await supabase
      .from('companies')
      .select('id')
      .eq('sector', sector);

    if (sectorError || !companies) {
      return NextResponse.json({ error: 'Failed to fetch sector companies' }, { status: 500 });
    }

    const companyIds = companies.map(c => c.id);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    // 3. Fetch latest 200 days of price records for all companies in the sector
    const { data: prices, error: pricesError } = await supabase
      .from('market_prices')
      .select('company_id, volume, price_date')
      .in('company_id', companyIds)
      .in('source', ['egx_bulletin', 'tradingview', 'yahoo_historical', 'mubasher', 'investing'])
      .gte('price_date', thirtyDaysAgo)
      .order('price_date', { ascending: true })
      .limit(300);

    if (pricesError || !prices) {
      return NextResponse.json({ error: 'Failed to fetch market prices' }, { status: 500 });
    }

    // De-duplicate prices per (company_id, price_date)
    const dailyMap: Record<string, any> = {};
    prices.forEach((p: any) => {
      const key = `${p.company_id}_${p.price_date}`;
      dailyMap[key] = p;
    });
    const uniquePrices = Object.values(dailyMap);

    // Get unique dates
    const uniqueDates = Array.from(new Set(uniquePrices.map(p => p.price_date))).sort();

    // 4. Calculate Sector daily volume
    const sectorDailyVols = uniqueDates.map(date => {
      return uniquePrices
        .filter(p => p.price_date === date)
        .reduce((sum, p) => sum + (p.volume || 0), 0);
    });

    const sectorAvg20 = getRollingMean(sectorDailyVols, 20);
    const sectorRatios = sectorDailyVols.map((v, idx) => sectorAvg20[idx] > 0 ? v / sectorAvg20[idx] : 1);

    const sectorRatioMap: Record<string, number> = {};
    uniqueDates.forEach((date, idx) => {
      sectorRatioMap[date] = sectorRatios[idx];
    });

    // 5. Target stock volumes
    const targetPrices = uniquePrices.filter(p => p.company_id === companyId);
    const targetDates = targetPrices.map(p => p.price_date);
    const targetVols = targetPrices.map(p => p.volume || 0);
    const targetAvg20 = getRollingMean(targetVols, 20);
    const targetRatios = targetVols.map((v, idx) => targetAvg20[idx] > 0 ? v / targetAvg20[idx] : 1);

    // 6. Calculate Sector Relative Volume
    const series = targetDates.map((date, idx) => {
      const stockRatio = targetRatios[idx];
      const sectorRatio = sectorRatioMap[date] || 1;
      const val = sectorRatio > 0 ? stockRatio / sectorRatio : 1.0;
      return {
        date,
        val
      };
    });

    return NextResponse.json({ sector, series });
  } catch (err: any) {
    console.error('Sector volume API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
