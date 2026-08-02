import { NextRequest, NextResponse } from 'next/server';
import { getRawSupabaseClient } from '@/lib/postgres-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getRawSupabaseClient();
    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get('company_id');
    const symbol = searchParams.get('symbol');

    if (!company_id && !symbol) {
      return NextResponse.json({ error: 'Missing company_id or symbol parameter' }, { status: 400 });
    }

    let query = supabase.from('seasonality_patterns').select('*').order('month', { ascending: true });

    if (company_id) {
      query = query.eq('company_id', company_id);
    } else if (symbol) {
      query = query.ilike('symbol', `%${symbol}%`);
    }

    const { data: seasonality, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const currentMonth = new Date().getMonth() + 1; // 1 to 12
    const currentMonthStat = (seasonality || []).find((s: any) => s.month === currentMonth);

    return NextResponse.json({
      success: true,
      current_month: currentMonth,
      current_month_stat: currentMonthStat || null,
      seasonality: seasonality || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
