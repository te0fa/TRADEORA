import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcMarketRegime } from '@/lib/ta-utils';
import { TradeRiskLevelsEvaluator, MarketDataEvaluator, TechnicalIndicatorEvaluator } from '@/lib/domain';

export const dynamic = 'force-dynamic';

// Constitution Constants (Article 5.3 & Article 11.3)
const CONSTITUTIONAL_MIN_CONFIDENCE = 0.65;
const FRA_DISCLAIMER_AR = "تنويه الهيئة العامة للرقابة المالية: مستويات الدعم والمقاومة وأهداف الصفقة هي لأغراض الدراسة والتعليم فقط وليست توصية بالبيع أو الشراء.";

// GET: Fetch recommended trades and statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const symbol = searchParams.get('symbol');

    // 1. Fetch trades with company details
    let query = supabase
      .from('recommended_trades')
      .select('*, companies(name_ar, name_en, sector)')
      .order('recommended_at', { ascending: false });

    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    const { data: trades, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    // 2. Fetch latest prices for active companies
    const activeCompanyIds = Array.from(
      new Set((trades || []).filter(t => t.company_id).map(t => t.company_id))
    );

    const priceMap: Record<string, number> = {};
    if (activeCompanyIds.length > 0) {
      const { data: latestPrices } = await supabase
        .from('market_prices')
        .select('company_id, close_price, price_date, source')
        .in('company_id', activeCompanyIds)
        .order('price_date', { ascending: false });

      if (latestPrices) {
        // First pass: TradingView source
        latestPrices.forEach((p: any) => {
          if (!priceMap[p.company_id] && p.source === 'tradingview') {
            priceMap[p.company_id] = parseFloat(p.close_price);
          }
        });
        // Second pass: Any fallback source
        latestPrices.forEach((p: any) => {
          if (!priceMap[p.company_id]) {
            priceMap[p.company_id] = parseFloat(p.close_price);
          }
        });
      }
    }

    // Enforce gating and append explainability / FRA disclaimer / current_price / sector
    const processedTrades = (trades || []).map((t: any) => {
      const confidence = t.ml_probability ? parseFloat(t.ml_probability) : null;
      const requiresWarning = confidence !== null && confidence < 0.75;
      const currentPrice = t.company_id && priceMap[t.company_id] ? priceMap[t.company_id] : t.entry_price;
      const isBuy = (t.direction || 'buy').toLowerCase() === 'buy';

      // Compute expected target date (3-5 business days from recommendation date)
      const recDate = t.recommended_at ? new Date(t.recommended_at) : new Date();
      const expDateObj = new Date(recDate.getTime() + 4 * 24 * 60 * 60 * 1000);
      const expDateFormatted = expDateObj.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
      const expectedTargetDate = `${expDateFormatted} (3 - 5 أيام عمل)`;

      const companyNameStr = t.companies ? (t.companies.name_ar || t.companies.name_en) : t.symbol;
      const defaultRationale = isBuy
        ? `توصية شراء لسهم ${companyNameStr} (${t.symbol}) بناءً على ثبات السعر أعلى الدعم عند ${t.sl} ج.م، مع إشارة إيجابية لمؤشر RSI وزخم السيولة التجميعي. المستهدف الأول ${t.tp1} ج.م والمستهدف الثاني ${t.tp2} ج.م.`
        : `توصية بيع وتخفيف مراكز لسهم ${companyNameStr} (${t.symbol}) بناءً على ضغط البيع الفني وكسر الدعم عند ${t.entry_price} ج.م، مع مستهدف هبوط ${t.tp1} ج.م ووقف خسارة ${t.sl} ج.م.`;

      const snap = t.features_snapshot || {};
      const orderType = snap.order_type || 'MARKET';
      const triggerCondAr = snap.trigger_condition_ar || null;
      const dynamicExpDate = snap.expected_target_date || expectedTargetDate;

      return {
        ...t,
        direction: (t.direction || 'buy').toLowerCase(),
        company_name: companyNameStr,
        sector: t.companies ? t.companies.sector : null,
        current_price: currentPrice,
        confidence_warning: requiresWarning,
        fra_disclaimer: FRA_DISCLAIMER_AR,
        explanation_ar: t.explanation_ar || defaultRationale,
        expected_target_date: dynamicExpDate,
        order_type: orderType,
        trigger_condition_ar: triggerCondAr
      };
    });

    // 3. Fetch all closed trades to compute statistics
    const { data: allClosed, error: statsError } = await supabase
      .from('recommended_trades')
      .select('pnl_percent, status')
      .eq('status', 'closed');

    if (statsError) {
      throw statsError;
    }

    const totalTrades = (processedTrades || []).length;
    const activeTrades = (processedTrades || []).filter((t: any) => t.status === 'active' || t.status === 'tp1_hit').length;
    
    // Statistics for active live tracking
    const closedCount = allClosed?.length || 0;
    const winningTrades = allClosed?.filter((t: any) => (t.pnl_percent || 0) > 0) || [];
    const losingTrades = allClosed?.filter((t: any) => (t.pnl_percent || 0) < 0) || [];
    
    const winRate = closedCount > 0 ? (winningTrades.length / closedCount) * 100 : 0;
    const totalPnl = allClosed?.reduce((sum: number, t: any) => sum + parseFloat(t.pnl_percent || 0), 0) || 0;
    const avgPnl = closedCount > 0 ? totalPnl / closedCount : 0;

    return NextResponse.json({
      trades: processedTrades,
      stats: {
        total_trades: totalTrades,
        active_trades: activeTrades,
        closed_trades: closedCount,
        winning_trades: winningTrades.length,
        losing_trades: losingTrades.length,
        win_rate: parseFloat(winRate.toFixed(1)),
        total_pnl: parseFloat(totalPnl.toFixed(1)),
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
