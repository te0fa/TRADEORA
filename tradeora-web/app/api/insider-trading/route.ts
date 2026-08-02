import { NextRequest, NextResponse } from 'next/server';
import { getRawSupabaseClient } from '@/lib/postgres-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getRawSupabaseClient();
    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get('company_id');
    const symbol = searchParams.get('symbol');
    const limit = parseInt(searchParams.get('limit') || '30');

    let query = supabase
      .from('insider_trading')
      .select('*, companies(id, symbol, name_ar, sector)')
      .order('transaction_date', { ascending: false })
      .limit(limit);

    if (company_id) {
      query = query.eq('company_id', company_id);
    } else if (symbol) {
      query = query.ilike('symbol', `%${symbol}%`);
    }

    const { data: transactions, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: (transactions || []).length,
      transactions: transactions || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
