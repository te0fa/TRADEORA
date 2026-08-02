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

    let vpQuery = supabase.from('volume_profiles').select('*').order('calculated_at', { ascending: false }).limit(1);
    let lvlQuery = supabase.from('price_volume_levels').select('*').order('calculated_at', { ascending: false }).limit(10);

    if (company_id) {
      vpQuery = vpQuery.eq('company_id', company_id);
      lvlQuery = lvlQuery.eq('company_id', company_id);
    } else if (symbol) {
      vpQuery = vpQuery.ilike('symbol', `%${symbol}%`);
      lvlQuery = lvlQuery.ilike('symbol', `%${symbol}%`);
    }

    const [{ data: vpData }, { data: lvlData }] = await Promise.all([
      vpQuery,
      lvlQuery
    ]);

    const vp = vpData?.[0] || null;
    const levels = lvlData || [];

    const vwap_daily = levels.find((l: any) => l.level_type === 'vwap_daily')?.price || null;
    const vwap_weekly = levels.find((l: any) => l.level_type === 'vwap_weekly')?.price || null;
    const vwap_monthly = levels.find((l: any) => l.level_type === 'vwap_monthly')?.price || null;
    const has_delta_divergence = levels.some((l: any) => l.level_type === 'delta_divergence');

    return NextResponse.json({
      success: true,
      volume_profile: vp ? {
        vpoc: Number(vp.vpoc),
        vah: Number(vp.vah),
        val: Number(vp.val),
        poc_volume: Number(vp.poc_volume),
        total_volume: Number(vp.total_volume),
        calculated_at: vp.calculated_at
      } : null,
      vwap: {
        daily: vwap_daily ? Number(vwap_daily) : null,
        weekly: vwap_weekly ? Number(vwap_weekly) : null,
        monthly: vwap_monthly ? Number(vwap_monthly) : null,
      },
      has_delta_divergence,
      levels
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
