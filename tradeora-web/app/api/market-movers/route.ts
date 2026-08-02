import { NextRequest, NextResponse } from 'next/server';
import { getRawSupabaseClient } from '@/lib/postgres-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getRawSupabaseClient();
    
    // Fetch active companies with their latest prices
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, symbol, name_ar, sector')
      .eq('status', 'active');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch latest market prices
    const { data: prices } = await supabase
      .from('market_prices')
      .select('company_id, symbol, open_price, close_price, high_price, low_price, volume, price_date')
      .order('price_date', { ascending: false })
      .limit(600);

    const priceMap = new Map();
    (prices || []).forEach((p: any) => {
      if (!priceMap.has(p.company_id)) {
        priceMap.set(p.company_id, p);
      }
    });

    const stockList = (companies || []).map((co: any) => {
      const p = priceMap.get(co.id);
      const open = p?.open_price ? Number(p.open_price) : 0;
      const close = p?.close_price ? Number(p.close_price) : 0;
      const volume = p?.volume ? Number(p.volume) : 0;
      const changePct = open > 0 ? Number((((close - open) / open) * 100).toFixed(2)) : 0;
      const turnOverEgp = Number((close * volume).toFixed(0));

      return {
        id: co.id,
        symbol: co.symbol,
        name_ar: co.name_ar,
        sector: co.sector,
        price: close,
        change_pct: changePct,
        volume,
        turnover_egp: turnOverEgp
      };
    }).filter((s: any) => s.price > 0);

    // Top Gainers (الأكثر ارتفاعاً)
    const topGainers = [...stockList].sort((a, b) => b.change_pct - a.change_pct).slice(0, 7);

    // Top Losers (الأكثر انخفاضاً)
    const topLosers = [...stockList].sort((a, b) => a.change_pct - b.change_pct).slice(0, 7);

    // Most Active Volume (الأنشط بحجم التداول)
    const mostActiveVolume = [...stockList].sort((a, b) => b.volume - a.volume).slice(0, 7);

    // Most Active Value (الأنشط بقيمة التداول)
    const mostActiveValue = [...stockList].sort((a, b) => b.turnover_egp - a.turnover_egp).slice(0, 7);

    return NextResponse.json({
      success: true,
      top_gainers: topGainers,
      top_losers: topLosers,
      most_active_volume: mostActiveVolume,
      most_active_value: mostActiveValue
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
