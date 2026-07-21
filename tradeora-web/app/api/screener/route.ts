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
      .select('id, symbol, name_ar, name_en, sector, is_shariah_compliant')
      .order('symbol');

    if (compError) throw compError;
    if (!companies) return NextResponse.json([]);

    // جلب آخر سعر وRSI لكل سهم
    const ids = companies.map(c => c.id);

    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const { data: prices, error: priceError } = await sb
      .from('market_prices')
      .select('company_id, close_price, open_price, high_price, low_price, volume, price_date, change_percent, change_value')
      .in('company_id', ids)
      .gte('price_date', sevenDaysAgo)
      .order('price_date', { ascending: false })
      .limit(400);

    if (priceError) throw priceError;

    // آخر سعر لكل سهم
    const priceMap: Record<string, any> = {};
    for (const p of prices ?? []) {
      if (!priceMap[p.company_id]) {
        priceMap[p.company_id] = p;
      }
    }

    // جلب التوصيات النشطة لكل سهم
    const { data: activeTrades, error: tradesError } = await sb
      .from('recommended_trades')
      .select('company_id, direction, win_rate_hist')
      .eq('status', 'active');

    if (tradesError) throw tradesError;

    const statsMap: Record<string, any> = {};
    for (const t of activeTrades ?? []) {
      statsMap[t.company_id] = {
        signal_type: t.direction,
        win_rate_tp1: t.win_rate_hist,
        total_signals: 1
      };
    }

    // دمج البيانات
    const result = companies
      .map(c => {
        const p = priceMap[c.id];
        const s = statsMap[c.id];
        if (!p) return null;

        return {
          id:                   c.id,
          symbol:               c.symbol,
          name_ar:              c.name_ar,
          name_en:              c.name_en,
          sector:               c.sector === 'بنوك' ? 'البنوك' : (c.sector === 'عقارات' ? 'العقارات والإنشاءات' : c.sector),
          is_shariah_compliant: Boolean(c.is_shariah_compliant),
          price:                p.close_price,
          change:               p.change_percent ?? null,
          volume:               p.volume,
          date:                 p.price_date,
          signal:               s?.signal_type ?? null,
          win_rate:             s?.win_rate_tp1 ?? null,
          signals_count:        s?.total_signals ?? 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/screener:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
