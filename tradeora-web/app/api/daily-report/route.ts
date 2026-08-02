import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const LAUNCH_DATE = '2026-07-29T22:42:00+00:00';

    // Fetch unique available recommendation dates
    const { data: dateRows } = await supabase
      .from('recommended_trades')
      .select('recommended_at')
      .or('exit_reason.is.null,exit_reason.neq.pre_launch_reset')
      .gte('recommended_at', LAUNCH_DATE)
      .order('recommended_at', { ascending: false });

    const availableDatesSet = new Set<string>();
    (dateRows || []).forEach((r: any) => {
      if (r.recommended_at) {
        availableDatesSet.add(r.recommended_at.split('T')[0]);
      }
    });
    const availableDates = Array.from(availableDatesSet);
    const selectedDateStr = dateParam || (availableDates.length > 0 ? availableDates[0] : new Date().toISOString().split('T')[0]);

    // Fetch trade recommendations for the specified date or default latest date
    let query = supabase
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
      .or('exit_reason.is.null,exit_reason.neq.pre_launch_reset')
      .gte('recommended_at', LAUNCH_DATE)
      .order('ml_probability', { ascending: false });

    if (dateParam) {
      query = query.gte('recommended_at', `${dateParam}T00:00:00Z`).lte('recommended_at', `${dateParam}T23:59:59Z`);
    } else if (availableDates.length > 0) {
      // Default to latest date with trades
      const latestDate = availableDates[0];
      query = query.gte('recommended_at', `${latestDate}T00:00:00Z`).lte('recommended_at', `${latestDate}T23:59:59Z`);
    }

    const { data: trades, error: tradesErr } = await query;

    if (tradesErr) {
      console.error('Error fetching recommended trades:', tradesErr);
    }

    // Fetch fundamentals map
    const { data: funcs } = await supabase
      .from('company_fundamentals')
      .select('company_id, fair_value, upside_potential, dividend_yield, last_dividend_amount, pe_ratio');

    const funcMap = new Map();
    (funcs || []).forEach((f: any) => funcMap.set(f.company_id, f));

    // Combine trades with fundamentals and normalize target price & stop loss field names for DailyReportView
    const enrichedTrades = (trades || []).map((t: any) => {
      const f = t.company_id ? funcMap.get(t.company_id) : null;
      const tp1 = t.target_price_1 ?? t.tp1 ?? null;
      const tp2 = t.target_price_2 ?? t.tp2 ?? null;
      const sl = t.stop_loss ?? t.sl ?? null;

      return {
        ...t,
        target_price_1: tp1,
        target_price_2: tp2,
        stop_loss: sl,
        fair_value: f?.fair_value || null,
        upside_potential: f?.upside_potential || null,
        dividend_yield: f?.dividend_yield || null,
        last_dividend_amount: f?.last_dividend_amount || null,
        pe_ratio: f?.pe_ratio || null
      };
    });

    // Categorize Buy and Sell/Caution recommendations
    let buyTrades = enrichedTrades.filter((t: any) => t.trade_type === 'BUY' || t.direction === 'buy');
    let sellTrades = enrichedTrades.filter((t: any) => t.trade_type === 'SELL' || t.direction === 'sell');

    // Fetch market overview stats
    const { data: priceData } = await supabase
      .from('market_prices')
      .select('change_percent')
      .order('price_date', { ascending: false })
      .limit(300);

    let gaining = 0;
    let losing = 0;
    let unchanged = 0;

    (priceData || []).forEach((p: any) => {
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
      report_date: selectedDateStr,
      available_dates: availableDates,
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
