import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcMarketRegime } from '@/lib/ta-utils';
import { TradeRiskLevelsEvaluator, MarketDataEvaluator, TechnicalIndicatorEvaluator } from '@/lib/domain';

// Constitution Constants (Article 5.3 & Article 11.3)
const CONSTITUTIONAL_MIN_CONFIDENCE = 0.65;
const FRA_DISCLAIMER_AR = "تنويه الهيئة العامة للرقابة المالية: مستويات الدعم والمقاومة وأهداف الصفقة هي لأغراض الدراسة والتعليم فقط وليست توصية بالبيع أو الشراء.";

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

    // Enforce gating and append explainability / FRA disclaimer metadata to active trades
    const processedTrades = (trades || []).map((t) => {
      const confidence = t.ml_probability ? parseFloat(t.ml_probability) : null;
      const requiresWarning = confidence !== null && confidence < 0.75;
      
      return {
        ...t,
        confidence_warning: requiresWarning,
        fra_disclaimer: FRA_DISCLAIMER_AR,
        explanation_ar: t.explanation_ar || `توصية ${t.direction === 'buy' ? 'شراء' : 'بيع'} بناءً على تحليل النماذج المتعددة بأسهم ${t.symbol} ونسبة مخاطرة/مكافأة مدروسة.`
      };
    });

    // 2. Fetch all closed trades to compute statistics
    const { data: allClosed, error: statsError } = await supabase
      .from('recommended_trades')
      .select('pnl_percent, status')
      .eq('status', 'closed');

    if (statsError) {
      throw statsError;
    }

    const totalTrades = (processedTrades || []).length;
    const activeTrades = (processedTrades || []).filter(t => t.status === 'active').length;
    
    // Statistics for active live tracking from today onwards
    const closedCount = allClosed?.length || 0;
    const winningTrades = allClosed?.filter(t => (t.pnl_percent || 0) > 0) || [];
    const losingTrades = allClosed?.filter(t => (t.pnl_percent || 0) < 0) || [];
    
    // Default to clean zero metrics when starting live tracking
    const winRate = closedCount > 0 ? (winningTrades.length / closedCount) * 100 : 0;
    const totalPnl = allClosed?.reduce((sum, t) => sum + parseFloat(t.pnl_percent || 0), 0) || 0;
    const avgPnl = closedCount > 0 ? totalPnl / closedCount : 0;

    return NextResponse.json({
      trades: processedTrades,
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
      features_snapshot,
      explanation_ar
    } = body;

    if (!symbol || !entry_price || !tp1 || !tp2 || !sl || !timeframe) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Dynamic thresholds from system settings
    let minRR = 1.5;
    let minML = CONSTITUTIONAL_MIN_CONFIDENCE; // Supreme Constitution rule: minimum 0.65
    try {
      const { data: settingsRes } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'risk_management')
        .maybeSingle();
      if (settingsRes?.value) {
        minRR = Number(settingsRes.value.min_risk_reward ?? 1.5);
        minML = Math.max(Number(settingsRes.value.min_ml_probability ?? CONSTITUTIONAL_MIN_CONFIDENCE), CONSTITUTIONAL_MIN_CONFIDENCE);
      }
    } catch (e) {
      console.warn('Error fetching system settings thresholds, using defaults.', e);
    }

    const parsedEntry = parseFloat(entry_price);
    const parsedTP1 = parseFloat(tp1);
    const parsedTP2 = parseFloat(tp2);
    const parsedSL = parseFloat(sl);
    const parsedML = ml_probability ? parseFloat(ml_probability) : null;

    // 1. Constitutional Gating Gate (Article 5.3): Reject confidence < 0.65
    if (parsedML !== null && parsedML < minML) {
      return NextResponse.json(
        { error: `درجة ثقة التوصية (${(parsedML * 100).toFixed(0)}%) أقل من الحد الأدنى المسموح به دستوريين (${(minML * 100).toFixed(0)}%). تم استبعاد التوصية.` },
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

    // 3. Validate Market Regime (Market Regime Filter for Buy signals)
    let resolvedCompanyId = company_id;
    if (!resolvedCompanyId && symbol) {
      const { data: compData } = await supabase
        .from('companies')
        .select('id')
        .eq('symbol', symbol.toUpperCase())
        .maybeSingle();
      if (compData) {
        resolvedCompanyId = compData.id;
      }
    }

    if (direction === 'buy' && resolvedCompanyId) {
      const { data: priceData, error: priceError } = await supabase
        .from('market_prices')
        .select('high_price, low_price, close_price')
        .eq('company_id', resolvedCompanyId)
        .order('price_date', { ascending: false })
        .limit(60);

      if (!priceError && priceData && priceData.length >= 28) {
        const prices = [...priceData].reverse();
        const highs = prices.map(p => Number(p.high_price ?? p.close_price));
        const lows = prices.map(p => Number(p.low_price ?? p.close_price));
        const closes = prices.map(p => Number(p.close_price));

        const regimeArr = calcMarketRegime(highs, lows, closes);
        const lastRegime = regimeArr.at(-1) ?? 0;

        if (lastRegime !== 1) {
          const reason = lastRegime === -1 
            ? 'اتجاه السوق هابط (Bearish)' 
            : 'حركة السوق عرضية ضيقة (Sideways)';
          return NextResponse.json(
            { error: `لا يمكن توليد إشارة شراء لأن ${reason}. تم تفعيل فلتر حالة السوق لتجنب الإشارات الخاطئة (Whipsaws).` },
            { status: 400 }
          );
        }
      }
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
      { error: 'حدث خطأ، حاول مرة أخرى' },
      { status: 500 }
    );
  }
}
