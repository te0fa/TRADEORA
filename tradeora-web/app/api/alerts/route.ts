/**
 * GET /api/alerts
 * Fetch unread + recent trade alerts for the current user.
 * Supports Supabase Realtime subscription from the frontend.
 *
 * Query params:
 *   ?limit=20        – max alerts to return (default 20)
 *   ?urgency=high    – filter by minimum urgency
 *   ?unread=true     – only unread
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

const URGENCY_RANK: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1
};

export async function GET(req: NextRequest) {
  const sb      = getSupabase();
  const params  = req.nextUrl.searchParams;
  const limit   = Math.min(parseInt(params.get('limit') || '20'), 50);
  const urgency = params.get('urgency') || 'medium';
  const unread  = params.get('unread') === 'true';

  try {
    let query = sb
      .from('trade_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unread) query = query.eq('is_read', false) as any;

    // Filter by minimum urgency
    const urgencyFilter = Object.entries(URGENCY_RANK)
      .filter(([, rank]) => rank >= (URGENCY_RANK[urgency] || 2))
      .map(([key]) => key);
    query = query.in('urgency', urgencyFilter) as any;

    const { data: alerts, error } = await query;
    if (error) throw error;

    // Unread count
    const { count } = await sb
      .from('trade_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    return NextResponse.json({
      alerts: alerts || [],
      unread_count: count || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/alerts
 * Mark alerts as read.
 * Body: { alert_ids: string[] } or { mark_all: true }
 */
export async function PATCH(req: NextRequest) {
  const sb   = getSupabase();
  const body = await req.json();

  try {
    if (body.mark_all) {
      await sb.from('trade_alerts').update({ is_read: true }).eq('is_read', false);
    } else if (body.alert_ids?.length) {
      await sb.from('trade_alerts').update({ is_read: true }).in('id', body.alert_ids);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
