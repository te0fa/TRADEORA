import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company_id = searchParams.get('company_id');
    const symbol = searchParams.get('symbol');
    const event_type = searchParams.get('event_type');
    const limit = parseInt(searchParams.get('limit') || '30');

    let query = supabase
      .from('corporate_events')
      .select('*')
      .order('event_date', { ascending: true })
      .limit(limit);

    if (company_id) {
      query = query.eq('company_id', company_id);
    } else if (symbol) {
      query = query.ilike('symbol', `%${symbol}%`);
    }

    if (event_type) {
      query = query.eq('event_type', event_type);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching corporate_events:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const now = new Date();
    const enrichedEvents = (events || []).map((ev: any) => {
      const evDate = new Date(ev.event_date);
      const diffTime = evDate.getTime() - now.getTime();
      const countdown_days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      let type_ar = 'فعالية شركية';
      if (ev.event_type === 'earnings_release' || ev.event_type === 'earnings') type_ar = 'إعلان أرباح وقوائم مالية';
      else if (ev.event_type === 'general_assembly') type_ar = 'جمعية عمومية';
      else if (ev.event_type === 'dividend_payout' || ev.event_type === 'dividend') type_ar = 'توزيعات أرباح';
      else if (ev.event_type === 'board_meeting') type_ar = 'اجتماع مجلس إدارة';

      return {
        ...ev,
        countdown_days,
        type_ar,
        is_upcoming: true
      };
    });

    return NextResponse.json({
      success: true,
      count: enrichedEvents.length,
      events: enrichedEvents
    });
  } catch (err: any) {
    console.error('Corporate events API error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
