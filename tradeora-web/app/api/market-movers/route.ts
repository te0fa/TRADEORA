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
        const high = Number(p.high_price || close);
        const low = Number(p.low_price || close);
        const volume = Number(p.volume || 0);

        if (close <= 0) return null;

        const rawChange = open > 0 && close > 0 ? Number((((close - open) / open) * 100).toFixed(2)) : 0;
        let changePct = rawChange;
        if (changePct > 20.0) changePct = 19.99;
        if (changePct < -20.0) changePct = -19.99;

        let volatilityPct = low > 0 && high > 0 ? Number((((high - low) / low) * 100).toFixed(2)) : Math.abs(changePct);
        if (volatilityPct > 25.0) volatilityPct = 24.8;

        const isLimitUpHalt = rawChange >= 19.8 || rawChange >= 9.8;
        const isLimitDownHalt = rawChange <= -19.8 || rawChange <= -9.8;
        const isHalted = isLimitUpHalt || isLimitDownHalt;

        let haltStatusAr = null;
        if (isLimitUpHalt) {
          haltStatusAr = '⏸️ موقوف مؤقتاً (حد أقصى +20%)';
        } else if (isLimitDownHalt) {
          haltStatusAr = '⏸️ موقوف مؤقتاً (حد أدنى -20%)';
        }

        return {
          id: co.id,
          symbol: co.symbol,
          name_ar: co.name_ar || co.symbol,
          sector: co.sector || 'عام',
          price: close,
          change_pct: changePct,
          volatility_pct: volatilityPct,
          volume: volume,
          turnover_egp: close * volume,
          price_date: p.price_date,
          is_halted: isHalted,
          halt_status_ar: haltStatusAr,
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
        most_volatile_scalp: [],
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

    // Fast Intraday Scalp Volatility Movers (الأسهم الأكثر تذبذباً وسرعة بالحركة)
    const mostVolatileScalp = [...stockList]
      .filter(s => s.volume > 50000) // minimum liquidity requirement
      .sort((a, b) => b.volatility_pct - a.volatility_pct)
      .slice(0, 9);

    return NextResponse.json({
      success: true,
      top_gainers: topGainers,
      top_losers: topLosers,
      most_active_volume: mostActiveVolume,
      most_active_value: mostActiveValue,
      most_volatile_scalp: mostVolatileScalp,
      total_stocks_analyzed: stockList.length,
    });
  } catch (err: any) {
    console.error('Market movers API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
