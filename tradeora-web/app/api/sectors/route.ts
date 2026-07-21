import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, symbol, sector');

    if (compError || !companies) {
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    // Get latest resolved prices via RPC
    const { data: prices } = await supabase.rpc('get_latest_prices');

    const { data: stats } = await supabase
      .from('signal_stats')
      .select('company_id, signal_type, win_rate_tp1')
      .eq('timeframe', '1d');

    const priceMap: Record<string, any> = {};
    for (const p of prices ?? []) {
      priceMap[p.company_id] = p;
    }

    const statsMap: Record<string, any> = {};
    for (const s of stats ?? []) {
      statsMap[s.company_id] = s;
    }

    const sectorMap: Record<string, {
      total: number; rising: number; falling: number; unchanged: number;
      buySignals: number; sellSignals: number;
      avgChange: number; changes: number[];
      avgWinRate: number; winRates: number[];
      sources: Set<string>;
    }> = {};

    for (const co of companies) {
      if (!co.sector) continue;
      let normalizedSector = co.sector.trim();
      if (normalizedSector === 'بنوك') normalizedSector = 'البنوك';
      if (normalizedSector === 'عقارات') normalizedSector = 'العقارات والإنشاءات';

      const p = priceMap[co.id];
      const s = statsMap[co.id];

      if (!sectorMap[normalizedSector]) {
        sectorMap[normalizedSector] = {
          total: 0, rising: 0, falling: 0, unchanged: 0,
          buySignals: 0, sellSignals: 0,
          avgChange: 0, changes: [],
          avgWinRate: 0, winRates: [],
          sources: new Set()
        };
      }

      const sec = sectorMap[normalizedSector];
      sec.total++;

      if (p) {
        if (p.source) sec.sources.add(p.source);
        const change = p.change_percent != null ? Number(p.change_percent) : null;
        if (change !== null && !isNaN(change)) {
          sec.changes.push(change);
          if (change > 0) sec.rising++;
          else if (change < 0) sec.falling++;
          else sec.unchanged++;
        } else {
          sec.unchanged++;
        }
      } else {
        sec.unchanged++;
      }

      if (s?.signal_type === 'buy')  sec.buySignals++;
      if (s?.signal_type === 'sell') sec.sellSignals++;
      if (s?.win_rate_tp1) sec.winRates.push(s.win_rate_tp1);
    }

    const result = Object.entries(sectorMap).map(([name, d]) => {
      const avgChange = d.changes.length > 0 ? d.changes.reduce((a, b) => a + b, 0) / d.changes.length : 0;
      const avgWinRate = d.winRates.length > 0 ? d.winRates.reduce((a, b) => a + b, 0) / d.winRates.length : 0;

      return {
        name,
        total:      d.total,
        rising:     d.rising,
        falling:    d.falling,
        unchanged:  d.unchanged,
        buySignals: d.buySignals,
        sellSignals:d.sellSignals,
        avgChange:  parseFloat(avgChange.toFixed(2)),
        avgWinRate: parseFloat(avgWinRate.toFixed(1)),
        strength:   d.buySignals - d.sellSignals,
        sourcesCount: d.sources.size,
        sources: Array.from(d.sources)
      };
    }).sort((a, b) => b.avgChange - a.avgChange);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Sectors API Error:', err);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحميل بيانات القطاعات' }, { status: 500 });
  }
}
