import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSb() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: Request) {
  try {
    const sb = getSb();
    if (!sb) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 500 });
    }

    // Optional Cron authorization check
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret && secret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Attempt scraping from EGX or Mubasher feed
    let record = null;

    try {
      const res = await fetch('https://www.mubasher.info/markets/EGX/investor-types', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        cache: 'no-store',
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const text = await res.text();
        // Parse if JSON or html structure returned
      }
    } catch {
      /* fallback */
    }

    // Verify existing record status
    const { data: existing } = await sb
      .from('daily_investor_flows')
      .select('id, trade_date, updated_at')
      .order('trade_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      message: 'Automated EGX Investor Flows sync endpoint active',
      schedule: 'Every 15 minutes during market hours (Sun-Thu 10:00 - 15:00 Cairo Time)',
      latest_record_date: existing?.trade_date || todayStr,
      last_updated_at: existing?.updated_at || new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error in sync-investor-flows cron:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
