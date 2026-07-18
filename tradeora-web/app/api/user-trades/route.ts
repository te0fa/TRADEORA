import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch user's active/closed trades and portfolio stats
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore Server Component sets
            }
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user trades
    const { data: trades, error: fetchError } = await supabase
      .from('user_trades')
      .select('*')
      .eq('user_id', userId)
      .order('activated_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    // Compute stats
    const totalTrades = trades?.length || 0;
    const activeTrades = trades?.filter(t => t.status === 'active' || t.status === 'tp1_hit').length || 0;
    const closedTrades = trades?.filter(t => t.status === 'closed') || [];
    const closedCount = closedTrades.length;

    const winningTrades = closedTrades.filter(t => Number(t.pnl_percent || 0) >= 0);
    const losingTrades = closedTrades.filter(t => Number(t.pnl_percent || 0) < 0);

    const winRate = closedCount > 0 ? (winningTrades.length / closedCount) * 100 : 0;
    const totalPnlAmount = closedTrades.reduce((sum, t) => sum + Number(t.pnl_amount || 0), 0);
    
    // Find best and worst trade PnL %
    let bestTradeSymbol = '-';
    let bestTradePct = 0;
    let worstTradeSymbol = '-';
    let worstTradePct = 0;

    if (closedCount > 0) {
      const sortedByPct = [...closedTrades].sort((a, b) => Number(b.pnl_percent || 0) - Number(a.pnl_percent || 0));
      const best = sortedByPct[0];
      const worst = sortedByPct[sortedByPct.length - 1];

      if (best) {
        bestTradeSymbol = best.symbol;
        bestTradePct = Number(best.pnl_percent || 0);
      }
      if (worst) {
        worstTradeSymbol = worst.symbol;
        worstTradePct = Number(worst.pnl_percent || 0);
      }
    }

    return NextResponse.json({
      success: true,
      trades,
      stats: {
        total_trades: totalTrades,
        active_trades: activeTrades,
        closed_trades: closedCount,
        winning_trades: winningTrades.length,
        losing_trades: losingTrades.length,
        win_rate: parseFloat(winRate.toFixed(1)),
        total_pnl_amount: parseFloat(totalPnlAmount.toFixed(1)),
        best_trade_symbol: bestTradeSymbol,
        best_trade_pct: parseFloat(bestTradePct.toFixed(1)),
        worst_trade_symbol: worstTradeSymbol,
        worst_trade_pct: parseFloat(worstTradePct.toFixed(1))
      }
    });
  } catch (error: any) {
    console.error('Error in GET /api/user-trades:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST: Create a new user trade position
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore Server Component sets
            }
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    const newTrade = {
      user_id: session.user.id,
      company_id: body.company_id,
      symbol: body.symbol,
      direction: body.direction || 'buy',
      entry_price: Number(body.entry_price),
      shares_count: Number(body.shares_count || 1),
      tp1: Number(body.tp1),
      tp2: Number(body.tp2),
      sl: Number(body.sl),
      timeframe: body.timeframe || 'D',
      ml_probability: body.ml_probability ? Number(body.ml_probability) : null,
      features_snapshot: body.features_snapshot || null,
      status: 'active',
      activated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_trades')
      .insert([newTrade])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, trade: data });
  } catch (error: any) {
    console.error('Error in POST /api/user-trades:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
