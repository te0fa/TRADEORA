import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: Fetch recommended trades and statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const symbol = searchParams.get('symbol');

    // 1. Fetch trades
    let query = supabase
      .from('recommended_trades')
      .select('*')
      .order('recommended_at', { ascending: false });

    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    const { data: trades, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    // 2. Fetch all closed trades to compute statistics
    const { data: allClosed, error: statsError } = await supabase
      .from('recommended_trades')
      .select('pnl_percent, status')
      .eq('status', 'closed');

    if (statsError) {
      throw statsError;
    }

    const totalTrades = (trades || []).length;
    const activeTrades = (trades || []).filter(t => t.status === 'active').length;
    
    // Statistics for all time closed trades
    const closedCount = allClosed?.length || 0;
    const winningTrades = allClosed?.filter(t => (t.pnl_percent || 0) > 0) || [];
    const losingTrades = allClosed?.filter(t => (t.pnl_percent || 0) <= 0) || [];
    
    const winRate = closedCount > 0 ? (winningTrades.length / closedCount) * 100 : 0;
    const totalPnl = allClosed?.reduce((sum, t) => sum + parseFloat(t.pnl_percent || 0), 0) || 0;
    const avgPnl = closedCount > 0 ? totalPnl / closedCount : 0;

    return NextResponse.json({
      trades,
      stats: {
        total_trades: totalTrades,
        active_trades: activeTrades,
        closed_trades: closedCount,
        winning_trades: winningTrades.length,
        losing_trades: losingTrades.length,
        win_rate: parseFloat(winRate.toFixed(2)),
        total_pnl: parseFloat(totalPnl.toFixed(2)),
        avg_pnl: parseFloat(avgPnl.toFixed(2))
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/trades:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Save a new recommended trade
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      company_id,
      symbol,
      direction,
      entry_price,
      tp1,
      tp2,
      sl,
      timeframe,
      ml_probability,
      win_rate_hist,
      features_snapshot
    } = body;

    if (!symbol || !entry_price || !tp1 || !tp2 || !sl || !timeframe) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newTrade = {
      company_id: company_id || null,
      symbol: symbol.toUpperCase(),
      direction: direction || 'buy',
      entry_price: parseFloat(entry_price),
      tp1: parseFloat(tp1),
      tp2: parseFloat(tp2),
      sl: parseFloat(sl),
      timeframe,
      status: 'active',
      ml_probability: ml_probability ? parseFloat(ml_probability) : null,
      win_rate_hist: win_rate_hist ? parseFloat(win_rate_hist) : null,
      features_snapshot: features_snapshot || null,
      recommended_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('recommended_trades')
      .insert([newTrade])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, trade: data[0] });
  } catch (error: any) {
    console.error('Error in POST /api/trades:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
