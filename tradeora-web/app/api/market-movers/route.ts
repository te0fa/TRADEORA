import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { data: companies } = await supabase
      .from('companies')
      .select('id, symbol, name_ar, sector')
      .eq('status', 'active');

    // Fetch the LATEST price per company — using real 308k rows
    const { data: prices, error: priceErr } = await supabase
      .from('market_prices')
      .select('company_id, open_price, close_price, high_price, low_price, volume, price_date')
      .order('price_date', { ascending: false })
      .limit(5000);

    if (priceErr) {
      console.error('Error fetching market_prices in market-movers:', priceErr);
    }

    const priceMap = new Map<string, any>();
    (prices || []).forEach((p: any) => {
      if (!priceMap.has(p.company_id)) {
        priceMap.set(p.company_id, p);
      }
    });

    const stockList = (companies || [])
      .map((co: any) => {
        const p = priceMap.get(co.id);
        if (!p) return null;

        const open = Number(p.open_price || 0);
        const close = Number(p.close_price || 0);
        const volume = Number(p.volume || 0);

        if (close <= 0) return null;

        let changePct = 0;
        if (open > 0 && close > 0) {
          changePct = Number((((close - open) / open) * 100).toFixed(2));
        }

        return {
          id: co.id,
          symbol: co.symbol,
          name_ar: co.name_ar || co.symbol,
          sector: co.sector || 'عام',
          price: close,
          change_pct: changePct,
          volume: volume,
          turnover_egp: close * volume,
          price_date: p.price_date,
        };
      })
      .filter(Boolean) as any[];

    if (stockList.length === 0) {
      return NextResponse.json({
        success: true,
        top_gainers: [],
        top_losers: [],
        most_active_volume: [],
        most_active_value: [],
        note: 'لا توجد بيانات أسعار متاحة حالياً',
      });
    }

    const topGainers = [...stockList]
      .sort((a, b) => b.change_pct - a.change_pct)
      .slice(0, 9);

    const topLosers = [...stockList]
      .sort((a, b) => a.change_pct - b.change_pct)
      .slice(0, 9);

    const mostActiveVolume = [...stockList]
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 9);

    const mostActiveValue = [...stockList]
      .sort((a, b) => b.turnover_egp - a.turnover_egp)
      .slice(0, 9);

    return NextResponse.json({
      success: true,
      top_gainers: topGainers,
      top_losers: topLosers,
      most_active_volume: mostActiveVolume,
      most_active_value: mostActiveValue,
      total_stocks_analyzed: stockList.length,
    });
  } catch (err: any) {
    console.error('Market movers API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
