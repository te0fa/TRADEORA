import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // جلب كل الأسهم مع آخر سعر ومؤشراتها
    const { data: companies, error: compError } = await sb
      .from('companies')
      .select('id, symbol, name_ar, name_en, sector')
      .order('symbol');

    if (compError) throw compError;
    if (!companies) return NextResponse.json([]);

    // جلب آخر سعر وRSI لكل سهم
    const ids = companies.map(c => c.id);

    const { data: prices, error: priceError } = await sb
      .from('market_prices')
      .select('company_id, close_price, open_price, high_price, low_price, volume, price_date, change_percent, change_value')
      .in('company_id', ids)
      .order('price_date', { ascending: false });

    if (priceError) throw priceError;

    // آخر سعر لكل سهم
    const priceMap: Record<string, any> = {};
    for (const p of prices ?? []) {
      if (!priceMap[p.company_id]) {
        priceMap[p.company_id] = p;
      }
    }

    // جلب signal_stats لكل سهم
    const { data: stats, error: statsError } = await sb
      .from('signal_stats')
      .select('company_id, timeframe, signal_type, win_rate_tp1, total_signals')
      .eq('timeframe', '1d');

    if (statsError) throw statsError;

    const statsMap: Record<string, any> = {};
    for (const s of stats ?? []) {
      statsMap[s.company_id] = s;
    }

    // دمج البيانات
    const result = companies
      .map(c => {
        const p = priceMap[c.id];
        const s = statsMap[c.id];
        if (!p) return null;

        return {
          id:         c.id,
          symbol:     c.symbol,
          name_ar:    c.name_ar,
          name_en:    c.name_en,
          sector:     c.sector,
          price:      p.close_price,
          change:     p.change_percent ?? null,
          volume:     p.volume,
          date:       p.price_date,
          signal:     s?.signal_type ?? 'neutral',
          win_rate:   s?.win_rate_tp1 ?? null,
          signals_count: s?.total_signals ?? 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/screener:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
