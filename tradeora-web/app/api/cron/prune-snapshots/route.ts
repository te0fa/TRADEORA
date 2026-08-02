import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete snapshots older than 90 days to keep database ultra-lightweight and fast
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('intraday_snapshots')
      .delete()
      .lt('snapshot_time', ninetyDaysAgo);

    if (error) {
      console.error('Error pruning old intraday_snapshots:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`[Cron Prune] Successfully cleaned up stale snapshots older than ${ninetyDaysAgo}`);
    return NextResponse.json({
      success: true,
      message: 'Cleaned up stale intraday snapshots older than 90 days',
      ninetyDaysAgo
    });
  } catch (err: any) {
    console.error('Prune cron failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
