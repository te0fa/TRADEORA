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

    // Fetch dynamic thresholds from system settings
    let minRR = 1.5;
    let minML = 0.58;
    try {
      const { data: settingsRes } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'risk_management')
        .maybeSingle();
      if (settingsRes?.value) {
        minRR = Number(settingsRes.value.min_risk_reward ?? 1.5);
        minML = Number(settingsRes.value.min_ml_probability ?? 0.58);
      }
    } catch (e) {
      console.warn('Error fetching system settings thresholds, using defaults.', e);
    }

    const parsedEntry = parseFloat(entry_price);
    const parsedTP1 = parseFloat(tp1);
    const parsedTP2 = parseFloat(tp2);
    const parsedSL = parseFloat(sl);
    const parsedML = ml_probability ? parseFloat(ml_probability) : null;

    // 1. Validate ML Probability if provided
    if (parsedML !== null && parsedML < minML) {
      return NextResponse.json(
        { error: `الاحتمال المتوقع للنجاح (${(parsedML * 100).toFixed(0)}%) أقل من الحد الأدنى المسموح به (${(minML * 100).toFixed(0)}%)` },
        { status: 400 }
      );
    }

    // 2. Validate Risk/Reward Ratio
    const isSell = direction === 'sell';
    const reward = isSell ? (parsedEntry - ((parsedTP1 + parsedTP2) / 2)) : (((parsedTP1 + parsedTP2) / 2) - parsedEntry);
    const risk = isSell ? (parsedSL - parsedEntry) : (parsedEntry - parsedSL);
    const calculatedRR = risk > 0 ? (reward / risk) : 1.0;

    if (calculatedRR < minRR) {
      return NextResponse.json(
        { error: `نسبة العائد إلى المخاطرة (R:R = ${calculatedRR.toFixed(2)}) أقل من الحد الأدنى المسموح به (${minRR.toFixed(2)})` },
        { status: 400 }
      );
    }

    const newTrade = {
      company_id: company_id || null,
      symbol: symbol.toUpperCase(),
      direction: direction || 'buy',
      entry_price: parsedEntry,
      tp1: parsedTP1,
      tp2: parsedTP2,
      sl: parsedSL,
      timeframe,
      status: 'active',
      ml_probability: parsedML,
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
