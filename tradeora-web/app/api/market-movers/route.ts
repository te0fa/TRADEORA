import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch active companies from DB for symbol & Arabic name mapping
    const { data: companies } = await supabase
      .from('companies')
      .select('id, symbol, name_ar, sector')
      .eq('status', 'active');

    const companyMap = new Map<string, any>();
    (companies || []).forEach((c: any) => {
      if (c.symbol) companyMap.set(c.symbol.toUpperCase(), c);
    });

    // 2. Fetch official EGX halt bulletins for today's session
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: haltNews } = await supabase
      .from('company_news')
      .select('company_id, title, companies(symbol)')
      .ilike('title', '%إيقاف%')
      .gte('published_at', `${todayStr}T00:00:00Z`);

    const haltedSymbols = new Set<string>();
    (haltNews || []).forEach((n: any) => {
      const sym = n.companies?.symbol;
      if (sym) haltedSymbols.add(sym.toUpperCase());
    });

    // 3. Fetch LIVE real-time quotes directly from TradingView Scanner API
    const tvUrl = 'https://scanner.tradingview.com/egypt/scan';
    const payload = {
      filter: [{ left: 'type', operation: 'in_range', right: ['stock', 'dr', 'fund'] }],
      options: { lang: 'en' },
      symbols: { query: { types: [] }, tickers: [] },
      columns: ['name', 'description', 'close', 'change', 'change_abs', 'open', 'high', 'low', 'volume', 'value'],
      sort: { sortBy: 'change', sortOrder: 'desc' },
      range: [0, 350]
    };

    let tvData: any[] = [];
    try {
      const tvRes = await fetch(tvUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 5 } // Cache for 5 seconds max
      });
      if (tvRes.ok) {
        const json = await tvRes.json();
        tvData = json.data || [];
      }
    } catch (e) {
      console.error('Error fetching TradingView live scanner in market-movers:', e);
    }

    const stockList: any[] = [];

    if (tvData.length > 0) {
      // Process live TradingView scanner data
      for (const item of tvData) {
        const d = item.d;
        if (!d || d.length < 9) continue;

        const sym = String(d[0] || '').toUpperCase();
        const close = Number(d[2] || 0);
        const changePct = Number(d[3] || 0);
        const open = Number(d[5] || close);
        const high = Number(d[6] || close);
        const low = Number(d[7] || close);
        const volume = Number(d[8] || 0);
        const value = Number(d[9] || (close * volume));

        if (close <= 0) continue;

        const co = companyMap.get(sym);
        const companyId = co?.id || sym;
        const nameAr = co?.name_ar || d[1] || sym;
        const sector = co?.sector || 'عام';

        // Intraday volatility range
        let volatilityPct = low > 0 && high > 0 ? Number((((high - low) / low) * 100).toFixed(2)) : Math.abs(changePct);
        if (volatilityPct > 25.0) volatilityPct = 24.8;

        const isHalted = haltedSymbols.has(sym);

        stockList.push({
          id: companyId,
          symbol: sym,
          name_ar: nameAr,
          sector: sector,
          price: close,
          change_pct: Number(changePct.toFixed(2)),
          volatility_pct: volatilityPct,
          volume: volume,
          turnover_egp: value,
          price_date: todayStr,
          is_halted: isHalted,
          halt_status_ar: isHalted ? '⏸️ إيقاف رسمى من البورصة (10د)' : null,
        });
      }
    }

    // Fallback if TradingView Scanner API fails: read latest market_prices
    if (stockList.length === 0) {
      const { data: prices } = await supabase
        .from('market_prices')
        .select('company_id, open_price, close_price, high_price, low_price, volume, price_date')
        .order('price_date', { ascending: false })
        .limit(3000);

      const priceMap = new Map<string, any>();
      (prices || []).forEach((p: any) => {
        if (!priceMap.has(p.company_id)) priceMap.set(p.company_id, p);
      });

      (companies || []).forEach((co: any) => {
        const p = priceMap.get(co.id);
        if (!p) return;
        const close = Number(p.close_price || 0);
        const open = Number(p.open_price || close);
        if (close <= 0) return;
        const changePct = open > 0 ? Number((((close - open) / open) * 100).toFixed(2)) : 0;
        const isHalted = haltedSymbols.has(co.symbol.toUpperCase());

        stockList.push({
          id: co.id,
          symbol: co.symbol,
          name_ar: co.name_ar || co.symbol,
          sector: co.sector || 'عام',
          price: close,
          change_pct: changePct,
          volatility_pct: Math.abs(changePct),
          volume: Number(p.volume || 0),
          turnover_egp: close * Number(p.volume || 0),
          price_date: p.price_date,
          is_halted: isHalted,
          halt_status_ar: isHalted ? '⏸️ إيقاف رسمى من البورصة (10د)' : null,
        });
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

    const mostVolatileScalp = [...stockList]
      .filter(s => s.volume > 5000)
      .sort((a, b) => b.volatility_pct - a.volatility_pct)
      .slice(0, 9);

    return NextResponse.json({
      success: true,
      top_gainers: topGainers,
      top_losers: topLosers,
      most_active_volume: mostActiveVolume,
      most_active_value: mostActiveValue,
      most_volatile_scalp: mostVolatileScalp,
    });
  } catch (error: any) {
    console.error('Error in GET /api/market-movers:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
