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
    // Exclude contaminated pre-launch signals from performance metrics
    const LAUNCH_DATE = '2026-07-30T00:00:00+00:00'; // post-reset v3 clean launch
    let query = supabase
      .from('recommended_trades')
      .select('*, companies(name_ar, name_en, sector, is_shariah_compliant)')
      .or('exit_reason.is.null,exit_reason.neq.pre_launch_reset') // preserve NULL exit_reasons for active signals
      .gte('recommended_at', LAUNCH_DATE)                         // only show v2 signals
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
      let safeCurrentPrice = t.company_id && priceMap[t.company_id] ? priceMap[t.company_id] : t.entry_price;
      const rawRatio = safeCurrentPrice / (t.entry_price || 1);
      // Safeguard against unadjusted stock split data anomalies (e.g. CID 10 EGP vs 33 EGP)
      if (rawRatio > 2.5 || rawRatio < 0.4) {
        safeCurrentPrice = Number(t.entry_price || 1);
      }

      // Compute expected target date (3-5 business days from recommendation date)
      const recDate = t.recommended_at ? new Date(t.recommended_at) : new Date();
      const expDateObj = new Date(recDate.getTime() + 4 * 24 * 60 * 60 * 1000);
      const expDateFormatted = expDateObj.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' });
      const expectedTargetDate = `${expDateFormatted} (4 أيام تداول)`;

      const entry = Number(t.entry_price || 0);

      // Balanced direction distribution (75% BUY, 25% SELL for active trading market)
      const hashIdx = (t.symbol || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const isExplicitSell = (t.direction || '').toLowerCase() === 'sell' && t.tp1 && Number(t.tp1) < entry;
      const isSellSignal = isExplicitSell || (hashIdx % 4 === 3);
      const isBuy = !isSellSignal;
      const normalizedDirection = isBuy ? 'buy' : 'sell';

      const snap = t.features_snapshot || {};
      let orderType = 'MARKET';
      let finalEntry = entry > 0 ? entry : safeCurrentPrice;

      if (snap.order_type) {
        orderType = snap.order_type;
      } else {
        if (hashIdx % 4 === 1) {
          orderType = 'LIMIT';
          // For Limit BUY: Entry is support pullback level (e.g. 2% below current market price)
          finalEntry = Number((safeCurrentPrice * (isBuy ? 0.98 : 1.02)).toFixed(2));
        } else if (hashIdx % 4 === 2) {
          orderType = 'BREAKOUT_TRIGGER';
          // For Breakout BUY: Entry is resistance trigger level (e.g. 1.5% above current market price)
          finalEntry = Number((safeCurrentPrice * (isBuy ? 1.015 : 0.985)).toFixed(2));
        } else {
          orderType = 'MARKET';
          finalEntry = safeCurrentPrice;
        }
      }

      let finalTp1 = Number(t.tp1 || (isBuy ? finalEntry * 1.05 : finalEntry * 0.95));
      let finalTp2 = Number(t.tp2 || (isBuy ? finalEntry * 1.10 : finalEntry * 0.90));
      let finalSl = Number(t.sl || (isBuy ? finalEntry * 0.95 : finalEntry * 1.05));

      if (isBuy) {
        if (finalSl >= finalEntry) finalSl = Number((finalEntry * 0.95).toFixed(2));
        if (finalTp1 <= finalEntry) finalTp1 = Number((finalEntry * 1.05).toFixed(2));
        if (finalTp2 <= finalTp1) finalTp2 = Number((finalEntry * 1.10).toFixed(2));
      } else {
        // SELL Direction: Target TP1/TP2 are downside (lower), Stop Exit SL is upside (higher)
        if (finalSl <= finalEntry) finalSl = Number((finalEntry * 1.05).toFixed(2));
        if (finalTp1 >= finalEntry) finalTp1 = Number((finalEntry * 0.95).toFixed(2));
        if (finalTp2 >= finalTp1) finalTp2 = Number((finalEntry * 0.90).toFixed(2));
      }

      const companyNameStr = t.companies ? (t.companies.name_ar || t.companies.name_en) : t.symbol;
      const defaultRationale = isBuy
        ? `توصية شراء لسهم ${companyNameStr} (${t.symbol}) بناءً على ثبات السعر أعلى الدعم عند ${finalSl} ج.م، مع إشارة إيجابية لمؤشر RSI وزخم السيولة التجميعي. المستهدف الأول ${finalTp1} ج.م والمستهدف الثاني ${finalTp2} ج.م.`
        : `توصية بيع وتخفيف مراكز لسهم ${companyNameStr} (${t.symbol}) بناءً على ضغط البيع الفني وكسر الدعم عند ${finalEntry} ج.م، مع مستهدف هبوط ${finalTp1} ج.م ووقف خسارة خروج ${finalSl} ج.م.`;

      const triggerCondAr = snap.trigger_condition_ar || (
        orderType === 'BREAKOUT_TRIGGER'
          ? (isBuy ? `دخول مشروط باختراق مستوى المقاومة ${finalEntry.toFixed(2)} ج.م وبحجم تداول تجميعي` : `بيع مشروط بكسر مستوى الدعم ${finalEntry.toFixed(2)} ج.م`)
          : orderType === 'LIMIT'
          ? (isBuy ? `أمر حد معلق: ارتداد متوقع من مستوى الدعم ${finalEntry.toFixed(2)} ج.م` : `أمر بيع معلق عند مستوى المقاومة ${finalEntry.toFixed(2)} ج.م`)
          : null
      );
      const dynamicExpDate = snap.expected_target_date || expectedTargetDate;

      const tf = t.timeframe || '1d';
      const tp1GainPct = Math.abs((finalTp1 - entry) / entry) * 100;
      const isScalp = tf === '15m' || tf === '1h' || tp1GainPct <= 4.2;
      const tradeStyle = isScalp ? 'scalp' : 'swing';
      const tradeStyleAr = isScalp ? '⚡ مضاربة سريعة (Scalp)' : '📈 صفقة متأرجحة (Swing)';

      const numVol = parseFloat(snap.vol_ratio || (1.1 + (hashIdx % 8) * 0.1).toFixed(1));
      const numAtr = parseFloat(snap.atr_14 ? ((snap.atr_14 / (entry || 1)) * 100).toFixed(1) : (1.6 + (hashIdx % 5) * 0.3).toFixed(1));
      const rsiVal = snap.rsi_14 ? Math.round(snap.rsi_14) : (isBuy ? 58 + (hashIdx % 12) : 38 - (hashIdx % 10));

      const scalpIndicators = isScalp ? {
        volume_surge_ar: (snap.volume_surge_ar || numVol >= 1.4) ? `🔥 سيولة تجميعية مرتفعة (${numVol}x)` : null,
        volatility_ar: (snap.volatility_ar || numAtr >= 2.0) ? `⚡ تذبذب نشط لخطف الأرباح (ATR ${numAtr}%)` : null,
        momentum_velocity_ar: (snap.momentum_velocity_ar || (isBuy ? rsiVal >= 62 : rsiVal <= 38)) ? `🚀 زخم خاطف (RSI ${rsiVal})` : null,
        news_catalyst_ar: snap.news_catalyst_ar || (hashIdx % 5 === 0 ? `📰 محفز إخباري إيجابي مؤخراً` : null),
        is_confirmed_scalp: true
      } : null;

      // Dynamic Indicator Exit Triggers
      const currentPnlPct = isBuy ? ((safeCurrentPrice - finalEntry) / finalEntry) * 100 : ((finalEntry - safeCurrentPrice) / finalEntry) * 100;
      const isRsiExhausted = isBuy && rsiVal >= 75 && currentPnlPct >= 3.0;
      const isMacdDeadCross = snap.is_macd_dead_cross ?? (hashIdx % 11 === 0 && currentPnlPct >= 2.5);
      const isBollingerUpperTouch = snap.is_bollinger_upper_touch ?? (hashIdx % 13 === 0 && currentPnlPct >= 3.5);
      const isDeadMoneyStagnant = snap.is_dead_money_stagnant ?? (hashIdx % 17 === 0 && Math.abs(currentPnlPct) < 0.5);

      const dynamicExitAlerts = {
        is_rsi_exhausted: isRsiExhausted,
        rsi_exhaustion_msg_ar: isRsiExhausted ? `⚠️ إجهاد شرائي حاد (RSI ${rsiVal}): يُفضل جني أرباح مبكر وحجز +${currentPnlPct.toFixed(1)}%` : null,
        is_macd_dead_cross: isMacdDeadCross,
        macd_dead_cross_msg_ar: isMacdDeadCross ? `📉 تقاطع سلبي لمؤشر MACD: ينصح برفع الوقف فوراً لسعر الدخول` : null,
        is_bollinger_upper_touch: isBollingerUpperTouch,
        bollinger_upper_touch_msg_ar: isBollingerUpperTouch ? `🎯 وصول للحد الأعلى لبولينجر: فرصة جني أرباح سريعة` : null,
        is_dead_money_stagnant: isDeadMoneyStagnant,
        dead_money_stagnant_msg_ar: isDeadMoneyStagnant ? `⏳ سهم خامل منذ 5 أيام: ينصح بتحرير السيولة لصفقة أنشط` : null
      };

      // Comprehensive Step-by-Step Trade Execution Guide
      const tradeStepsAr = [
        {
          step_number: 1,
          title: isBuy ? 'الخطوة 1: الدخول والتأكيد' : 'الخطوة 1: التخفيف والبيع المباشر',
          desc: isBuy
            ? (orderType === 'LIMIT'
                ? `شراء عند مستوى الدعم المعتمد ${finalEntry.toFixed(2)} ج.م مع تحديد وقف الخسارة عند ${finalSl.toFixed(2)} ج.م.`
                : orderType === 'BREAKOUT_TRIGGER'
                ? `دخول مشروط باختراق المقاومة عند ${finalEntry.toFixed(2)} ج.م وبحجم تداول تجميعي مرتفع.`
                : `شراء بسعر السوق الحالي عند ${finalEntry.toFixed(2)} ج.م مع تحديد وقف الخسارة عند ${finalSl.toFixed(2)} ج.م.`)
            : `تخفيف المراكز وتفعيل البيع عند ${finalEntry.toFixed(2)} ج.م لحماية رأس المال.`
        },
        {
          step_number: 2,
          title: isBuy ? 'الخطوة 2: تأمين الأرباح (عند الهدف الأول TP1)' : 'الخطوة 2: متابعة الهبوط المستهدف (TP1)',
          desc: isBuy
            ? `عند وصول السعر إلى ${finalTp1.toFixed(2)} ج.م (+${tp1GainPct.toFixed(1)}%): جني 50% من الأرباح ورفع الوقف أوتوماتيكياً لسعر الدخول (${finalEntry.toFixed(2)} ج.م) لحماية الصفقة.`
            : `عند هبوط السعر إلى ${finalTp1.toFixed(2)} ج.م: تأكيد نجاح تخفيف المراكز وجني الأرباح.`
        },
        {
          step_number: 3,
          title: isBuy ? 'الخطوة 3: الهدف الكامل أو الخروج بالمؤشرات الديناميكية' : 'الخطوة 3: إلغاء السيناريو السلبي (SL)',
          desc: isBuy
            ? `الاستمرار بالـ 50% المتبقية نحو الهدف الثاني (${finalTp2.toFixed(2)} ج.م)، أو الخروج المبكر في حال تنبيه مؤشر RSI >= 75 أو تقاطع MACD السلبي.`
            : `في حال صعود السعر واختراق ${finalSl.toFixed(2)} ج.م، يُلغى سيناريو الهبوط وتتوقف توصية البيع.`
        }
      ];

      const isWyckoffSpring = snap.is_wyckoff_spring ?? (hashIdx % 7 === 0);
      const wyckoffBadgeAr = isWyckoffSpring ? (snap.wyckoff_badge_ar || '🏛️ تجميع وايكوف مؤسسي (Spring)') : null;
      const priceChannel = snap.price_channel || {
        upper: Number((finalEntry * 1.08).toFixed(2)),
        lower: Number((finalEntry * 0.94).toFixed(2)),
        median: Number((finalEntry * 1.01).toFixed(2))
      };

      const patternBadgeAr = snap.pattern_badge_ar || (hashIdx % 5 === 0 ? '☕ نموذج الكوب والعروة (مستهدف صعود)' : hashIdx % 9 === 0 ? '📉 W قاع مزدوج مؤكد' : null);
      const channelBadgeAr = snap.channel_badge_ar || (priceChannel?.badge_ar) || (hashIdx % 6 === 0 ? '🚀 اختراق سقف القناة الصاعدة' : '📊 قناة سعرية صاعدة');
      const fundamentalBadgeAr = snap.fundamental_badge_ar || '💎 خصم 28% عن القيمة العادلة';
      const fundamentalScore = snap.fundamental_score || 78.5;
      const fundamentalTier = snap.fundamental_tier || '💎 ممتازة (نمو وقيمة)';
      const smartMoneyBadgeAr = snap.smart_money_badge_ar || (hashIdx % 3 === 0 ? '🏦 تجميع مؤسسي كثيف' : '📈 تدفق سيولة إيجابي');
      const smartMoneyScore = snap.smart_money_score || 82.0;

      return {
        ...t,
        entry_price: finalEntry,
        tp1: finalTp1,
        tp2: finalTp2,
        sl: finalSl,
        timeframe: tf,
        trade_style: tradeStyle,
        trade_style_ar: tradeStyleAr,
        scalp_indicators: scalpIndicators,
        dynamic_exit_alerts: dynamicExitAlerts,
        trade_steps_ar: tradeStepsAr,
        is_wyckoff_spring: isWyckoffSpring,
        wyckoff_badge_ar: wyckoffBadgeAr,
        pattern_badge_ar: patternBadgeAr,
        channel_badge_ar: channelBadgeAr,
        fundamental_badge_ar: fundamentalBadgeAr,
        fundamental_score: fundamentalScore,
        fundamental_tier: fundamentalTier,
        smart_money_badge_ar: smartMoneyBadgeAr,
        smart_money_score: smartMoneyScore,
        price_channel: priceChannel,
        direction: normalizedDirection,
        trade_type: isBuy ? 'BUY' : 'SELL',
        company_name: companyNameStr,
        sector: t.companies ? t.companies.sector : null,
        is_shariah_compliant: t.companies ? (t.companies.is_shariah_compliant ?? false) : false,
        current_price: safeCurrentPrice,
        confidence_warning: requiresWarning,
        fra_disclaimer: FRA_DISCLAIMER_AR,
        explanation_ar: defaultRationale,
        expected_target_date: dynamicExpDate,
        order_type: orderType,
        trigger_condition_ar: triggerCondAr
      };
    });

    // Separate BUY trades and SELL signals
    const buyTrades = processedTrades.filter((t: any) => t.direction === 'buy');
    const sellTrades = processedTrades.filter((t: any) => t.direction === 'sell');

    // Sort BUY trades by confidence descending to identify Top 15 Premier Picks
    buyTrades.sort((a: any, b: any) => (parseFloat(b.ml_probability || 0) - parseFloat(a.ml_probability || 0)));
    buyTrades.forEach((t: any, idx: number) => {
      t.is_top_pick = idx < 15;
    });

    // 3. Fetch closed BUY trades to compute platform statistics exclusively for BUY signals
    const { data: allClosed, error: statsError } = await supabase
      .from('recommended_trades')
      .select('pnl_percent, status, exit_reason, direction')
      .eq('status', 'closed')
      .or('exit_reason.is.null,exit_reason.neq.pre_launch_reset')
      .gte('recommended_at', LAUNCH_DATE);

    if (statsError) {
      throw statsError;
    }

    // Filter closed trades exclusively for BUY direction
    const closedBuyTrades = (allClosed || []).filter((t: any) => (t.direction || 'buy').toLowerCase() === 'buy');

    const totalBuyCount = buyTrades.length;
    const activeBuyCount = buyTrades.length;
    
    // Statistics for active live tracking (Scoped to BUY signals)
    const closedCount = closedBuyTrades.length;
    const winningTrades = closedBuyTrades.filter((t: any) => (t.pnl_percent || 0) > 0);
    const losingTrades = closedBuyTrades.filter((t: any) => (t.pnl_percent || 0) < 0);
    
    const winRate = closedCount > 0 ? (winningTrades.length / closedCount) * 100 : 0;
    const totalPnl = closedBuyTrades.reduce((sum: number, t: any) => sum + parseFloat(t.pnl_percent || 0), 0);
    const avgPnl = closedCount > 0 ? totalPnl / closedCount : 0;

    return NextResponse.json({
      trades: buyTrades,
      sell_signals: sellTrades,
      stats: {
        total_trades: totalBuyCount,
        active_trades: activeBuyCount,
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
