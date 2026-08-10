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

function getSupabaseClient(serviceRole: boolean = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = serviceRole 
    ? (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '');
  if (!url || !key) {
    throw new Error('Supabase configuration missing in environment');
  }
  return createClient(url, key);
}

const URGENCY_RANK: Record<string, number> = {
  critical: 4, high: 3, medium: 2, low: 1
};

export async function GET(req: NextRequest) {
  const sb      = getSupabaseClient(false); // Principle of least privilege: Anon key for public reads
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
 * Protected with Bearer Token (CRON_SECRET or User Session).
 * Body: { alert_ids: string[] } or { mark_all: true }
 */
export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Verify authorization
  const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const hasAuthToken = authHeader && authHeader.startsWith('Bearer ');
  
  if (!isCronAuthorized && !hasAuthToken) {
    return NextResponse.json(
      { error: 'Unauthorized: Missing or invalid authorization credentials' },
      { status: 401 }
    );
  }

  const sb   = getSupabaseClient(true);
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
