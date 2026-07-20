import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: stats, error } = await supabase
      .from('signal_stats')
      .select('win_rate_tp1, signal_type')
      .eq('timeframe', '1d');

    if (error) {
      console.error('Error querying signal_stats in market-summary:', error);
    }

    const buySignals = stats?.filter(s => s.win_rate_tp1 !== null && s.win_rate_tp1 > 0) ?? [];
    
    const rawSum = buySignals.reduce((sum, s) => {
      const rate = Number(s.win_rate_tp1 ?? 0);
      return sum + (rate > 1 ? rate / 100 : rate);
    }, 0);

    const avgWinRate = buySignals.length > 0
      ? (rawSum / buySignals.length) * 100
      : null;

    return NextResponse.json({
      aiScore: avgWinRate !== null ? Math.round(avgWinRate) : null,
      buyCount: stats?.filter(s => s.signal_type === 'buy').length ?? 0,
      sellCount: stats?.filter(s => s.signal_type === 'sell').length ?? 0,
    });
  } catch (error: any) {
    console.error('Error in GET /api/market-summary:', error);
    return NextResponse.json({
      aiScore: null,
      buyCount: 0,
      sellCount: 0,
    });
  }
}
