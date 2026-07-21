import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch active trade recommendations
    const { data: trades, error: tradesErr } = await supabase
      .from('recommended_trades')
      .select(`
        *,
        company:companies (
          id,
          symbol,
          name_ar,
          name_en,
          sector
        )
      `)
      .order('ml_probability', { ascending: false });

    if (tradesErr) {
      console.error('Error fetching recommended trades:', tradesErr);
    }

    // Fetch fundamentals map
    const { data: funcs } = await supabase
      .from('company_fundamentals')
      .select('company_id, fair_value, upside_potential, dividend_yield, last_dividend_amount, pe_ratio');

    const funcMap = new Map();
    (funcs || []).forEach(f => funcMap.set(f.company_id, f));

    // Combine trades with fundamentals
    const enrichedTrades = (trades || []).map(t => {
      const f = t.company_id ? funcMap.get(t.company_id) : null;
      return {
        ...t,
        fair_value: f?.fair_value || null,
        upside_potential: f?.upside_potential || null,
        dividend_yield: f?.dividend_yield || null,
        last_dividend_amount: f?.last_dividend_amount || null,
        pe_ratio: f?.pe_ratio || null
      };
    });

    // Categorize Buy and Sell/Caution recommendations
    const buyTrades = enrichedTrades.filter(t => t.trade_type === 'BUY');
    const sellTrades = enrichedTrades.filter(t => t.trade_type === 'SELL' || t.trade_type === 'HOLD');

    // Fetch market overview stats
    const { data: priceData } = await supabase
      .from('market_prices')
      .select('change_percent')
      .order('price_date', { ascending: false })
      .limit(300);

    let gaining = 0;
    let losing = 0;
    let unchanged = 0;

    (priceData || []).forEach(p => {
      if (p.change_percent > 0) gaining++;
      else if (p.change_percent < 0) losing++;
      else unchanged++;
    });

    // Fetch EGX30 index live value
    let egx30Value = 53758;
    let egx30Change = 1.19;

    try {
      const egxRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/egx30`);
      if (egxRes.ok) {
        const egxJson = await egxRes.json();
        if (egxJson.value) egx30Value = egxJson.value;
        if (egxJson.change) egx30Change = egxJson.change;
      }
    } catch (e) {
      // Fallback to default
    }

    return NextResponse.json({
      report_date: todayStr,
      market_overview: {
        egx30_value: egx30Value,
        egx30_change: egx30Change,
        gaining_companies: gaining,
        losing_companies: losing,
        unchanged_companies: unchanged,
        total_analyzed: (priceData || []).length
      },
      buy_opportunities: buyTrades,
      sell_caution_opportunities: sellTrades,
      total_opportunities: enrichedTrades.length
    });
  } catch (e: any) {
    console.error('Error generating daily report API:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
