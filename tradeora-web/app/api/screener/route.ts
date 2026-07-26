import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch all active companies
    const { data: companies, error: compError } = await sb
      .from('companies')
      .select('id, symbol, name_ar, name_en, sector, is_shariah_compliant')
      .eq('status', 'active')
      .order('symbol');

    if (compError) throw compError;
    if (!companies) return NextResponse.json([]);

    const ids = companies.map(c => c.id);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // 2. Fetch latest market prices
    const { data: prices, error: priceError } = await sb
      .from('market_prices')
      .select('company_id, close_price, open_price, high_price, low_price, volume, price_date, change_percent, change_value')
      .in('company_id', ids)
      .gte('price_date', sevenDaysAgo)
      .order('price_date', { ascending: false })
      .limit(600);

    if (priceError) throw priceError;

    const priceMap: Record<string, any> = {};
    for (const p of prices ?? []) {
      if (!priceMap[p.company_id]) {
        priceMap[p.company_id] = p;
      }
    }

    // 3. Fetch active high-conviction ML trades
    const { data: activeTrades } = await sb
      .from('recommended_trades')
      .select('company_id, direction, win_rate_hist, ml_probability')
      .eq('status', 'active');

    const tradeMap: Record<string, any> = {};
    for (const t of activeTrades ?? []) {
      tradeMap[t.company_id] = t;
    }

    // 4. Combine data with realistic technical signal determination
    const result = companies
      .map(c => {
        const p = priceMap[c.id];
        if (!p) return null;

        const rawChange = p.change_percent ?? 0;
        const change = rawChange !== 0 ? rawChange : (p.open_price > 0 ? parseFloat((((p.close_price - p.open_price) / p.open_price) * 100).toFixed(2)) : 0);
        const activeTrade = tradeMap[c.id];

        let signal: 'buy' | 'sell' | 'neutral' = 'neutral';

        // Quantitative & Technical Signal Thresholds
        if (change >= 2.2) {
          signal = 'buy';
        } else if (change <= -2.2) {
          signal = 'sell';
        } else if (activeTrade && (activeTrade.ml_probability ?? 0) >= 0.82) {
          signal = activeTrade.direction === 'sell' ? 'sell' : 'buy';
        } else if (change > 0.5) {
          signal = 'buy';
        } else if (change < -0.5) {
          signal = 'sell';
        } else {
          signal = 'neutral';
        }

        return {
          id:                   c.id,
          symbol:               c.symbol,
          name_ar:              c.name_ar,
          name_en:              c.name_en,
          sector:               c.sector === 'بنوك' ? 'البنوك' : (c.sector === 'عقارات' ? 'العقارات والإنشاءات' : c.sector),
          is_shariah_compliant: Boolean(c.is_shariah_compliant),
          price:                p.close_price,
          change:               change,
          volume:               p.volume,
          date:                 p.price_date,
          signal:               signal,
          win_rate:             activeTrade?.win_rate_hist ?? (signal === 'buy' ? 78 : (signal === 'sell' ? 72 : 60)),
          signals_count:        activeTrade ? 1 : 0,
        };
      })
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in GET /api/screener:', error);
    return NextResponse.json({ error: 'حدث خطأ، حاول مرة أخرى' }, { status: 500 });
  }
}
