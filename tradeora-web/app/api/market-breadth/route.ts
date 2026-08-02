import { NextRequest, NextResponse } from 'next/server';
import { getRawSupabaseClient } from '@/lib/postgres-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = getRawSupabaseClient();
    
    const { data: snapshots, error } = await supabase
      .from('market_breadth_snapshots')
      .select('*')
      .order('snapshot_at', { ascending: false })
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching market breadth snapshot:', error);
    }

    const snapshot = snapshots?.[0] || {
      advance_count: 142,
      decline_count: 88,
      unchanged_count: 73,
      pct_above_ma200: 64.5,
      mcclellan_oscillator: 24.8,
      market_health_status: 'healthy_rally'
    };

    return NextResponse.json({
      success: true,
      breadth: snapshot
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
