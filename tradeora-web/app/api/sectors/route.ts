import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, symbol, sector');

    const { data: prices } = await supabase
      .from('market_prices')
      .select('company_id, close_price, open_price, high_price, low_price, volume, price_date, change_percent, change_value')
      .order('price_date', { ascending: false });

    const { data: stats } = await supabase
      .from('signal_stats')
      .select('company_id, signal_type, win_rate_tp1')
      .eq('timeframe', '1d');

    // آخر سعر لكل سهم
    const priceMap: Record<string, any> = {};
    for (const p of prices ?? []) {
      if (!priceMap[p.company_id]) priceMap[p.company_id] = p;
    }

    const statsMap: Record<string, any> = {};
    for (const s of stats ?? []) {
      statsMap[s.company_id] = s;
    }

    // تجميع حسب القطاع
    const sectorMap: Record<string, {
      total: number; rising: number; falling: number
      buySignals: number; sellSignals: number
      avgChange: number; changes: number[]
      avgWinRate: number; winRates: number[]
    }> = {};

    for (const co of companies ?? []) {
      if (!co.sector) continue;
      const p = priceMap[co.id];
      const s = statsMap[co.id];
      if (!p) continue;

      const change = p.change_percent ?? null;

      if (!sectorMap[co.sector]) {
        sectorMap[co.sector] = {
          total: 0, rising: 0, falling: 0,
          buySignals: 0, sellSignals: 0,
          avgChange: 0, changes: [],
          avgWinRate: 0, winRates: []
        };
      }

      const sec = sectorMap[co.sector];
      sec.total++;
      if (change !== null) {
        sec.changes.push(change);
        if (change > 0) sec.rising++;
        if (change < 0) sec.falling++;
      }
      if (s?.signal_type === 'buy')  sec.buySignals++;
      if (s?.signal_type === 'sell') sec.sellSignals++;
      if (s?.win_rate_tp1) sec.winRates.push(s.win_rate_tp1);
    }

    const result = Object.entries(sectorMap).map(([name, d]) => ({
      name,
      total:      d.total,
      rising:     d.rising,
      falling:    d.falling,
      buySignals: d.buySignals,
      sellSignals:d.sellSignals,
      avgChange:  d.changes.reduce((a, b) => a + b, 0) / d.changes.length,
      avgWinRate: d.winRates.length > 0
        ? d.winRates.reduce((a, b) => a + b, 0) / d.winRates.length
        : 0,
      strength:   d.buySignals - d.sellSignals,
    })).sort((a, b) => b.strength - a.strength);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Sectors API Error:', err);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
