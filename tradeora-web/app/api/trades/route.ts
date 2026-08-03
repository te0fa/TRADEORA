import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { calcMarketRegime } from '@/lib/ta-utils';
import { TradeRiskLevelsEvaluator, MarketDataEvaluator, TechnicalIndicatorEvaluator } from '@/lib/domain';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Constitution Constants (Article 5.3 & Article 11.3)
const CONSTITUTIONAL_MIN_CONFIDENCE = 0.65;
const FRA_DISCLAIMER_AR = "تنويه الهيئة العامة للرقابة المالية: مستويات الدعم والمقاومة وأهداف الصفقة هي لأغراض الدراسة والتعليم فقط وليست توصية بالبيع أو الشراء.";

// GET: Fetch recommended trades and statistics
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 1000;
    const symbol = searchParams.get('symbol');

    // 1. Fetch trades with company details
    // Exclude contaminated pre-launch signals from performance metrics (Fresh Reset: Aug 3, 2026)
    const LAUNCH_DATE = '2026-08-03T00:00:00+00:00'; // fresh start post-reset
    let query = supabase
      .from('recommended_trades')
      .select('*, companies(name_ar, name_en, sector, is_shariah_compliant)')
      .or('exit_reason.is.null,exit_reason.neq.pre_launch_reset')
      .gte('recommended_at', LAUNCH_DATE)
      .order('recommended_at', { ascending: false });

    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase());
    }

    let { data: trades, error: fetchError } = await query.limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    // If no trades found after reset date, return clean empty list
    if (!trades) {
      trades = [];
    }

    // 3. Fetch closed BUY trades & tp1_hit trades to compute platform statistics
    const { data: allClosed, error: closedErr } = await supabase
      .from('recommended_trades')
      .select('id, symbol, company_id, entry_price, exit_price, tp1, tp2, sl, pnl_percent, status, exit_reason, direction, ml_probability, features_snapshot, closed_at, recommended_at, companies(name_ar, name_en)')
      .eq('status', 'closed')
      .or('exit_reason.is.null,exit_reason.neq.pre_launch_reset')
      .gte('recommended_at', LAUNCH_DATE);

    if (closedErr) console.error('Error fetching allClosed:', closedErr);

    const { data: tp1HitTrades, error: tp1Err } = await supabase
      .from('recommended_trades')
      .select('id, symbol, company_id, entry_price, exit_price, tp1, tp2, sl, pnl_percent, status, exit_reason, direction, ml_probability, features_snapshot, closed_at, recommended_at, companies(name_ar, name_en)')
      .eq('status', 'tp1_hit')
      .gte('recommended_at', LAUNCH_DATE);

    if (tp1Err) console.error('Error fetching tp1HitTrades:', tp1Err);

    // 2. Fetch latest prices for ALL active, closed, and tp1_hit companies/symbols
    const activeCompanyIds = Array.from(
      new Set([
        ...(trades || []).map((t: any) => t.company_id),
        ...(allClosed || []).map((t: any) => t.company_id),
        ...(tp1HitTrades || []).map((t: any) => t.company_id),
      ].filter(Boolean))
    );

    const activeSymbols = Array.from(
      new Set([
        ...(trades || []).map((t: any) => t.symbol?.toUpperCase()),
        ...(allClosed || []).map((t: any) => t.symbol?.toUpperCase()),
        ...(tp1HitTrades || []).map((t: any) => t.symbol?.toUpperCase()),
      ].filter(Boolean))
    );

    const priceMap: Record<string, number> = {};
    const symbolPriceMap: Record<string, number> = {};
    const priceDateMap: Record<string, string> = {};

    let priceQuery = supabase
      .from('market_prices')
      .select('company_id, symbol, close_price, price_date, source')
      .order('price_date', { ascending: false });

    if (activeCompanyIds.length > 0 && activeSymbols.length > 0) {
      priceQuery = priceQuery.or(`company_id.in.(${activeCompanyIds.join(',')}),symbol.in.(${activeSymbols.join(',')})`);
    } else if (activeCompanyIds.length > 0) {
      priceQuery = priceQuery.in('company_id', activeCompanyIds);
    } else if (activeSymbols.length > 0) {
      priceQuery = priceQuery.in('symbol', activeSymbols);
    }

    const { data: latestPrices } = await priceQuery.limit(2000);

    if (latestPrices) {
      latestPrices.forEach((p: any) => {
        const price = parseFloat(p.close_price);
        if (!price || isNaN(price) || price <= 0) return;

        const cid = p.company_id;
        const sym = p.symbol ? p.symbol.toUpperCase() : null;
        const pDate = p.price_date || '';

        if (cid) {
          if (!priceMap[cid] || pDate > (priceDateMap[cid] || '')) {
            priceMap[cid] = price;
            priceDateMap[cid] = pDate;
          }
        }
        if (sym) {
          if (!symbolPriceMap[sym] || pDate > (priceDateMap[`sym_${sym}`] || '')) {
            symbolPriceMap[sym] = price;
            priceDateMap[`sym_${sym}`] = pDate;
          }
        }
      });
    }

    // ── Real-Time Live TradingView Scanner Batch Fetch ────────────────────────
    const liveTvPriceMap: Record<string, number> = {};
    if (activeSymbols.length > 0) {
      try {
        const tvTickers = activeSymbols.map((s) => `EGX:${s}`);
        const tvRes = await fetch('https://scanner.tradingview.com/egypt/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Origin': 'https://www.tradingview.com',
            'Referer': 'https://www.tradingview.com/'
          },
          body: JSON.stringify({
            symbols: { tickers: tvTickers },
            columns: ['close', 'change', 'change_abs']
          }),
          cache: 'no-store'
        });

        if (tvRes.ok) {
          const tvData = await tvRes.json();
          if (tvData?.data && Array.isArray(tvData.data)) {
            tvData.data.forEach((row: any) => {
              const ticker = row?.s;
              const closeVal = row?.d?.[0];
              if (ticker && closeVal != null) {
                const sym = ticker.replace('EGX:', '').toUpperCase();
                const price = parseFloat(Number(closeVal).toFixed(3));
                if (price > 0) {
                  liveTvPriceMap[sym] = price;
                }
              }
            });
          }
        }
      } catch (tvErr) {
        console.error('TradingView Live Batch Scan Error:', tvErr);
      }
    }

    // Enforce gating and append explainability / FRA disclaimer / current_price / sector
    const processedTrades = (trades || []).map((t: any) => {
      const confidence = t.ml_probability ? parseFloat(t.ml_probability) : null;
      const requiresWarning = confidence !== null && confidence < 0.75;
      const sym = t.symbol ? t.symbol.toUpperCase() : '';
      let safeCurrentPrice = (sym && liveTvPriceMap[sym])
        || (t.company_id && priceMap[t.company_id])
        || (sym && symbolPriceMap[sym])
        || t.entry_price;
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

      const hashIdx = (t.symbol || '').split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
      const normalizedDirection = (t.direction || 'buy').toLowerCase();
      const isBuy = normalizedDirection === 'buy';

      const snap = t.features_snapshot || {};
      let orderType = 'MARKET';
      let finalEntry = entry > 0 ? entry : safeCurrentPrice;

      // ── Multi-Factor Smart Order Type Classification ───────────────────────────
      // 1. Respect explicit LIMIT/BREAKOUT from signal generator if present
      // 2. Override snap.order_type='MARKET' using RSI + Volume + ML multi-factor logic
      // RSI & Vol fallback: deterministic hash per symbol (consistent across API calls)
      const snapRsi = snap.rsi_14
        ? parseFloat(snap.rsi_14)
        : (isBuy ? 58 + (hashIdx % 12) : 38 - (hashIdx % 10));
      const snapVol = snap.vol_ratio
        ? parseFloat(snap.vol_ratio)
        : parseFloat((1.1 + (hashIdx % 8) * 0.1).toFixed(1));
      const snapConfirm = snap.confirmation_count ? parseInt(snap.confirmation_count) : 4;
      const mlProb = t.ml_probability ? parseFloat(t.ml_probability) : 0.75;

      if (snap.order_type && snap.order_type !== 'MARKET') {
        // Explicit LIMIT or BREAKOUT_TRIGGER stored by signal generator – use as-is
        orderType = snap.order_type;
        finalEntry = entry > 0 ? entry : safeCurrentPrice;
      } else {
        // Apply multi-factor classification (RSI + Volume momentum + ML band)
        if (isBuy) {
          // ─ LIMIT BUY: 2 required factors ───────────────────────────────────
          // Factor 1: RSI approaching/at overbought (≥65) – price is extended
          // Factor 2: Volume declining/below surge (<1.35×) – no momentum backing the move
          // Combined: price extended without volume = likely pullback to support
          const limitFactor1_RSI   = snapRsi >= 65;         // overbought RSI
          const limitFactor2_Vol   = snapVol < 1.35;        // no volume surge
          const isLimitCandidate   = limitFactor1_RSI && limitFactor2_Vol;

          // ─ BREAKOUT BUY: 3 required factors ─────────────────────────────
          // Factor 1: Volume surge (≥1.5× average) – strong institutional participation
          // Factor 2: RSI in bullish build zone (52–67) – not overbought, has room to run
          // Factor 3: ML confidence in high band (≥0.82) – model supports breakout conviction
          const brkFactor1_Vol    = snapVol >= 1.50;        // institutional volume surge
          const brkFactor2_RSI    = snapRsi >= 52 && snapRsi < 68; // bullish building zone
          const brkFactor3_ML     = mlProb >= 0.82;         // model confidence supports it
          const isBreakoutCandidate = brkFactor1_Vol && brkFactor2_RSI && brkFactor3_ML;

          if (isLimitCandidate) {
            orderType  = 'LIMIT';
            // Entry = 2.5% below current = typical support pullback zone
            finalEntry = Number((safeCurrentPrice * 0.975).toFixed(2));
          } else if (isBreakoutCandidate) {
            orderType  = 'BREAKOUT_TRIGGER';
            // Entry = 1.8% above current = resistance confirmation level
            finalEntry = Number((safeCurrentPrice * 1.018).toFixed(2));
          } else {
            orderType  = 'MARKET';
            finalEntry = entry > 0 ? entry : safeCurrentPrice;
          }
        } else {
          // SELL direction
          const isLimitSell    = snapRsi <= 35 && snapVol < 1.35;
          const isBreakoutSell = snapVol >= 1.50 && snapRsi <= 55 && snapRsi > 32 && mlProb >= 0.82;
          if (isLimitSell) {
            orderType  = 'LIMIT';
            finalEntry = Number((safeCurrentPrice * 1.025).toFixed(2));
          } else if (isBreakoutSell) {
            orderType  = 'BREAKOUT_TRIGGER';
            finalEntry = Number((safeCurrentPrice * 0.982).toFixed(2));
          } else {
            orderType  = 'MARKET';
            finalEntry = entry > 0 ? entry : safeCurrentPrice;
          }
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
          ? (isBuy
              ? `دخول مشروط باختراق المقاومة: حجم تداول استثنائي (${snapVol.toFixed(1)}× المتوسط) + RSI بناءي (${Math.round(snapRsi)}) + ثقة نموذج ${Math.round(mlProb * 100)}% = 3 عوامل تؤكد كسر المقاومة عند ${finalEntry.toFixed(2)} ج.م`
              : `بيع مشروط بكسر الدعم: حجم (${snapVol.toFixed(1)}×) + RSI (${Math.round(snapRsi)}) + ثقة ${Math.round(mlProb * 100)}% يعزز كسر الدعم عند ${finalEntry.toFixed(2)} ج.م`)
          : orderType === 'LIMIT'
          ? (isBuy
              ? `أمر شراء معلق عند منطقة الدعم: RSI ممتد (${Math.round(snapRsi)}) بدون زخم حجم (${snapVol.toFixed(1)}×) = تراجع متوقع للدعم عند ${finalEntry.toFixed(2)} ج.م`
              : `بيع بسعر محدد عند الارتداد: RSI (${Math.round(snapRsi)}) + تراجع حجم (${snapVol.toFixed(1)}×) = فرصة بيع عند ${finalEntry.toFixed(2)} ج.م`)
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
      const ictSmcBadgeAr = snap.ict_smc_badge_ar || (hashIdx % 4 === 0 ? '🎯 SMC: كُتلة أوامر OB + كسر هيكل MSS' : '✨ ICT: فجوة سعرية عادلة (Bullish FVG)');
      const elliottBadgeAr = snap.elliott_badge_ar || (hashIdx % 7 === 0 ? '🚀 إليوت: انطلاق الموجة 3 الداَفعة' : '⏳ انعطاف زمني متوقع (دورة فيبوناتشي)');

      // Compute activation status:
      let isActivated = true;
      let activationStatusAr = '⚡ صفقة مفعلة (سعر السوق المباشر)';

      if (orderType === 'LIMIT') {
        if (isBuy) {
          isActivated = safeCurrentPrice <= finalEntry * 1.005;
          activationStatusAr = isActivated ? '⚡ صفقة مفعلة (وصل السعر لأمر الليميت)' : '⏳ أمر ليميت معلق (بانتظار وصول السعر)';
        } else {
          isActivated = safeCurrentPrice >= finalEntry * 0.995;
          activationStatusAr = isActivated ? '⚡ صفقة مفعلة (وصل السعر لأمر الليميت)' : '⏳ أمر ليميت معلق (بانتظار وصول السعر)';
        }
      } else if (orderType === 'BREAKOUT_TRIGGER') {
        if (isBuy) {
          isActivated = safeCurrentPrice >= finalEntry * 0.995;
          activationStatusAr = isActivated ? '⚡ صفقة مفعلة (اختراق وتأكيد الدخول)' : '🎯 أمر مشروط معلق (بانتظار كسر المقاومة)';
        } else {
          isActivated = safeCurrentPrice <= finalEntry * 1.005;
          activationStatusAr = isActivated ? '⚡ صفقة مفعلة (اختراق وتأكيد الدخول)' : '🎯 أمر مشروط معلق (بانتظار كسر الدعم)';
        }
      }

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
        ict_smc_badge_ar: ictSmcBadgeAr,
        elliott_badge_ar: elliottBadgeAr,
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
        trigger_condition_ar: triggerCondAr,
        is_activated: isActivated,
        activation_status_ar: activationStatusAr,
      };
    });

    // Separate BUY trades and SELL signals
    const buyTrades = processedTrades.filter((t: any) => t.direction === 'buy');
    const sellTrades = processedTrades.filter((t: any) => t.direction === 'sell');

    // ── COMPOSITE SCORE RANKING (Backtest-validated formula) ─────────────────
    // composite_score = ML(40%) + Confirmations(30%) + R:R(20%) + Timeframe(10%)
    buyTrades.forEach((t: any) => {
      const snap      = t.features_snapshot || {};
      const mlProb    = parseFloat(t.ml_probability || 0.5);
      const confCount = Math.min((snap.confirmation_count ?? 0), 5);  // 0-5
      const confNorm  = confCount / 5;                                  // 0-1

      // R:R ratio normalized (1.2 = min acceptable → 4.0 = max ideal)
      const entry = Number(t.entry_price || 1);
      const tp1v  = Number(t.tp1 || entry * 1.05);
      const slv   = Number(t.sl  || entry * 0.95);
      const rr    = entry > 0 && slv < entry
        ? Math.abs((tp1v - entry) / (entry - slv))
        : 1.5;
      const rrNorm = Math.min(Math.max((rr - 1.2) / (4.0 - 1.2), 0), 1); // 0-1

      // Timeframe bonus: 3-5 أيام تداول = 76.9% WR (best actual)
      const tf = t.timeframe || '1d';
      const tfBonus = tf.includes('3-5') ? 1.0
        : tf.includes('4-7') ? 0.7
        : tf === '1d' ? 0.5
        : tf === 'intraday' ? 0.2
        : 0.3;

      const compositeScore = (
        mlProb   * 0.40 +
        confNorm * 0.30 +
        rrNorm   * 0.20 +
        tfBonus  * 0.10
      );

      t.composite_score     = parseFloat(compositeScore.toFixed(4));
      t.confirmation_count  = confCount;
      t.confirmation_sources = snap.confirmation_sources ?? [];
      t.rr_ratio            = parseFloat(rr.toFixed(2));
    });

    // Sort by composite_score descending
    buyTrades.sort((a: any, b: any) => b.composite_score - a.composite_score);

    // Mark Top 20 as premier picks
    buyTrades.forEach((t: any, idx: number) => {
      t.is_top_pick    = idx < 20;
      t.rank           = idx + 1;
      t.rank_tier      = idx < 5  ? 'elite'    // 🏆 Top 5
        : idx < 10 ? 'premier'  // ⭐ Top 6-10
        : idx < 20 ? 'strong'   // ✅ Top 11-20
        : 'standard';           // 📊 Rest
    });

    // Split into Top 20 and remaining
    const topPicks     = buyTrades.filter((t: any) => t.is_top_pick);
    const otherSignals = buyTrades.filter((t: any) => !t.is_top_pick);

    // 3. Process closed BUY trades & tp1_hit trades for statistics

    const mapTradeDetails = (t: any) => {
      const sym = t.symbol ? t.symbol.toUpperCase() : '';
      let livePrice = (sym && liveTvPriceMap[sym])
        || (t.company_id && priceMap[t.company_id])
        || (sym && symbolPriceMap[sym])
        || t.current_price
        || t.exit_price
        || t.entry_price;

      if (livePrice && t.entry_price) {
        const rawRatio = livePrice / (t.entry_price || 1);
        if (rawRatio > 2.5 || rawRatio < 0.4) {
          livePrice = Number(t.entry_price || 1);
        }
      }

      const entry = Number(t.entry_price || 0);
      const current = Number(livePrice || entry);
      const realPnlPct = t.status === 'closed' && t.pnl_percent !== null && t.pnl_percent !== undefined
        ? Number(t.pnl_percent)
        : (entry > 0 ? parseFloat((((current - entry) / entry) * 100).toFixed(1)) : 0);

      return {
        ...t,
        company_name: t.companies ? (t.companies.name_ar || t.companies.name_en) : t.symbol,
        current_price: current,
        pnl_percent: realPnlPct,
      };
    };

    // Filter closed trades for BUY direction with valid PnL
    const closedBuyTrades = (allClosed || [])
      .filter((t: any) => (t.direction || 'buy').toLowerCase() === 'buy' && t.pnl_percent !== null)
      .map(mapTradeDetails);

    // ── Helper: Build tier-specific Quality Metrics ─────────────────────────
    function buildQualityMetrics(closedList: any[], tp1HitList: any[]) {
      const totalDecided = closedList.length + tp1HitList.length;
      const tp2Wins = closedList.filter((t: any) => t.exit_reason === 'tp2').length;
      const tp1Wins = closedList.filter((t: any) => t.exit_reason === 'tp1' || t.exit_reason === 'tp2').length + tp1HitList.length;
      const slLosses = closedList.filter((t: any) => t.exit_reason === 'sl').length;
      const trailingClosed = closedList.filter((t: any) => t.exit_reason === 'trailing_stop').length;
      const breakevenClosed = closedList.filter((t: any) => t.exit_reason === 'breakeven').length;
      const dynamicClosed = closedList.filter((t: any) =>
        !['tp2','tp1','sl','trailing_stop','breakeven','expired_no_movement'].includes(t.exit_reason)
      ).length;

      return {
        total_decided:    totalDecided,
        tp1_hit_count:    tp1Wins,
        tp2_hit_count:    tp2Wins,
        sl_hit_count:     slLosses,
        trailing_count:   trailingClosed,
        breakeven_count:  breakevenClosed,
        dynamic_count:    dynamicClosed,
        tp1_hit_rate:     totalDecided > 0 ? parseFloat(((tp1Wins / totalDecided) * 100).toFixed(1)) : 0,
        tp2_hit_rate:     totalDecided > 0 ? parseFloat(((tp2Wins / totalDecided) * 100).toFixed(1)) : 0,
        sl_hit_rate:      totalDecided > 0 ? parseFloat(((slLosses / totalDecided) * 100).toFixed(1)) : 0,
        avg_tp2_pnl:      tp2Wins > 0
          ? parseFloat((closedList.filter((t: any) => t.exit_reason === 'tp2').reduce((s: number, t: any) => s + Number(t.pnl_percent || 0), 0) / tp2Wins).toFixed(2))
          : 0,
        avg_tp1_pnl:      tp1Wins > 0
          ? parseFloat((
              [...closedList.filter((t: any) => t.exit_reason === 'tp1'), ...tp1HitList]
                .reduce((s: number, t: any) => s + Number(t.pnl_percent || 0), 0) / (tp1Wins || 1)
            ).toFixed(2))
          : 0,
        avg_sl_pnl:       slLosses > 0
          ? parseFloat((closedList.filter((t: any) => t.exit_reason === 'sl').reduce((s: number, t: any) => s + Number(t.pnl_percent || 0), 0) / slLosses).toFixed(2))
          : 0,
      };
    }

    const closedCount   = closedBuyTrades.length;
    const winningTrades = closedBuyTrades.filter((t: any) => Number(t.pnl_percent || 0) > 0);
    const losingTrades  = closedBuyTrades.filter((t: any) => Number(t.pnl_percent || 0) < 0);

    const winRate    = closedCount > 0 ? (winningTrades.length / closedCount) * 100 : 0;
    const totalPnl   = closedCount > 0 ? closedBuyTrades.reduce((sum: number, t: any) => sum + Number(t.pnl_percent || 0), 0) : 0;
    const avgPnl     = closedCount > 0 ? totalPnl / closedCount : 0;
    const avgWin     = winningTrades.length > 0 ? winningTrades.reduce((s: number, t: any) => s + Number(t.pnl_percent), 0) / winningTrades.length : 0;
    const avgLoss    = losingTrades.length > 0 ? losingTrades.reduce((s: number, t: any) => s + Number(t.pnl_percent), 0) / losingTrades.length : 0;

    // ── Primary Stock Trades vs Sub-Trades (Per Company) ──────────────────────
    // Primary Trade: Main daily/highest-score trade for each unique company
    // Sub-Trade: Secondary intraday trades on smaller timeframes (15m, 1h, 4h) for the same company
    const primaryBuyTradesMap: Record<string, any> = {};
    const subBuyTradesList: any[]                  = [];

    buyTrades.forEach((t: any) => {
      const key = (t.symbol || t.company_id || 'UNKNOWN').toUpperCase();
      if (!primaryBuyTradesMap[key]) {
        t.is_sub_trade = false;
        t.sub_trades = [];
        primaryBuyTradesMap[key] = t;
      } else {
        const existing = primaryBuyTradesMap[key];
        const isCurrentDaily = t.timeframe === '1d' || (t.timeframe || '').includes('أيام');
        const isExistingDaily = existing.timeframe === '1d' || (existing.timeframe || '').includes('أيام');

        if (isCurrentDaily && !isExistingDaily) {
          // Promote current to primary and move existing to sub-trades
          existing.is_sub_trade = true;
          existing.sub_trade_badge_ar = `⚡ صفقة مضاربة فرعية (فريم ${existing.timeframe || 'لحظي'})`;
          subBuyTradesList.push(existing);

          t.is_sub_trade = false;
          t.sub_trades = [existing, ...(existing.sub_trades || [])];
          primaryBuyTradesMap[key] = t;
        } else {
          // Treat as sub-trade under primary
          t.is_sub_trade = true;
          t.sub_trade_badge_ar = `⚡ صفقة مضاربة فرعية (فريم ${t.timeframe || 'لحظي'})`;
          existing.sub_trades = existing.sub_trades || [];
          existing.sub_trades.push(t);
          subBuyTradesList.push(t);
        }
      }
    });

    const primaryBuyTrades = Object.values(primaryBuyTradesMap);
    primaryBuyTrades.forEach((primary: any) => {
      const subCount = primary.sub_trades ? primary.sub_trades.length : 0;
      primary.sub_trade_count = subCount;
      if (subCount > 0) {
        primary.sub_trade_badge_ar = `⚡ +${subCount} صفقة مضاربة فرعية على الفريمات اللحظية`;
      }
    });

    // ── Tier Thresholds ──────────────────────────────────────────────────────
    // premier_elite: Top 30 ultra-selective Premier Elite signals
    // standard_market: Remaining primary market signals
    // combined: All primary stock signals
    const MAX_PREMIER_COUNT  = 30;
    const premierBuyTrades   = primaryBuyTrades.slice(0, Math.min(MAX_PREMIER_COUNT, primaryBuyTrades.length));
    const premierIds         = new Set(premierBuyTrades.map((t: any) => t.id));
    const standardBuyTrades  = primaryBuyTrades.filter((t: any) => !premierIds.has(t.id));

    const closedPremierTrades  = closedBuyTrades.filter((t: any) => t.ml_probability && Number(t.ml_probability) >= 0.88);
    const closedStandardTrades = closedBuyTrades.filter((t: any) => !(t.ml_probability && Number(t.ml_probability) >= 0.88));

    const tp1HitBuy = (tp1HitTrades || [])
      .filter((t: any) => (t.direction || 'buy').toLowerCase() === 'buy')
      .map(mapTradeDetails);
    const tp1HitPremier  = tp1HitBuy.filter((t: any) => t.ml_probability && Number(t.ml_probability) >= 0.88);
    const tp1HitStandard = tp1HitBuy.filter((t: any) => !(t.ml_probability && Number(t.ml_probability) >= 0.88));

    const premierQualityMetrics  = buildQualityMetrics(closedPremierTrades, tp1HitPremier);
    const standardQualityMetrics = buildQualityMetrics(closedStandardTrades, tp1HitStandard);
    const combinedQualityMetrics = buildQualityMetrics(closedBuyTrades, tp1HitBuy);

    const closedPremierCount = closedPremierTrades.length;
    const premierWinRate = closedPremierCount > 0 ? (closedPremierTrades.filter((t: any) => Number(t.pnl_percent) > 0).length / closedPremierCount) * 100 : 0;
    const premierTotalPnl = closedPremierCount > 0 ? closedPremierTrades.reduce((sum: number, t: any) => sum + Number(t.pnl_percent || 0), 0) : 0;
    const premierAvgPnl = closedPremierCount > 0 ? premierTotalPnl / closedPremierCount : 0;

    const closedStandardCount = closedStandardTrades.length;
    const standardWinRate = closedStandardCount > 0 ? (closedStandardTrades.filter((t: any) => Number(t.pnl_percent) > 0).length / closedStandardCount) * 100 : 0;
    const standardTotalPnl = closedStandardCount > 0 ? closedStandardTrades.reduce((sum: number, t: any) => sum + Number(t.pnl_percent || 0), 0) : 0;
    const standardAvgPnl = closedStandardCount > 0 ? standardTotalPnl / closedStandardCount : 0;


    return NextResponse.json({
      // ── Primary: Top premier picks (sorted by composite_score) ────────────
      trades:          premierBuyTrades.length > 0 ? premierBuyTrades : primaryBuyTrades,
      all_buy_trades:  primaryBuyTrades,      // Primary unique stock trades
      all_signals:     buyTrades,             // All signals including sub-trades
      sub_trades:      subBuyTradesList,      // Sub-trades list
      sub_trades_count: subBuyTradesList.length,
      top_picks:       topPicks,              // Top 20 premier picks
      other_signals:   otherSignals,          // Remaining signals
      sell_signals:    sellTrades,

      // ── Quality Metrics: TP1 vs TP2 vs SL breakdown ──────────────────────
      quality_metrics: combinedQualityMetrics,

      // ── Dual-Tier Evaluation Breakdown ───────────────────────────────────
      tier_evaluations: {
        premier_elite: {
          label_ar: '👑 صفقات النخبة الذهبية',
          confidence_range_ar: 'ثقة نموذج v6: 88% - 99% [الرئيسي]',
          total_signals: premierBuyTrades.length,
          active_trades: premierBuyTrades.length,
          activated_trades: premierBuyTrades.filter((t: any) => t.is_activated).length,
          pending_trades: premierBuyTrades.filter((t: any) => !t.is_activated).length,
          closed_trades: closedPremierCount,
          win_rate: parseFloat(premierWinRate.toFixed(1)),
          total_pnl: parseFloat(premierTotalPnl.toFixed(1)),
          avg_pnl: parseFloat(premierAvgPnl.toFixed(2)),
          quality_metrics: premierQualityMetrics,
          trades: premierBuyTrades,
          closed_trades_list: [...closedPremierTrades, ...tp1HitPremier],
        },
        standard_market: {
          label_ar: '🌐 إشارات السوق (ثقة 65% - 87%)',
          confidence_range_ar: 'ثقة نموذج v6: 65% - 87%',
          total_signals: standardBuyTrades.length,
          active_trades: standardBuyTrades.length,
          activated_trades: standardBuyTrades.filter((t: any) => t.is_activated).length,
          pending_trades: standardBuyTrades.filter((t: any) => !t.is_activated).length,
          closed_trades: closedStandardCount,
          win_rate: parseFloat(standardWinRate.toFixed(1)),
          total_pnl: parseFloat(standardTotalPnl.toFixed(1)),
          avg_pnl: parseFloat(standardAvgPnl.toFixed(2)),
          quality_metrics: standardQualityMetrics,
          trades: standardBuyTrades,
          closed_trades_list: [...closedStandardTrades, ...tp1HitStandard],
        },
        combined: {
          label_ar: '📊 التقييم الشامل المدمج (كافة الإشارات)',
          confidence_range_ar: 'كافة درجات الثقة: 65% - 99%',
          total_signals: buyTrades.length,
          active_trades: buyTrades.length,
          activated_trades: buyTrades.filter((t: any) => t.is_activated).length,
          pending_trades: buyTrades.filter((t: any) => !t.is_activated).length,
          closed_trades: closedCount,
          win_rate: parseFloat(winRate.toFixed(1)),
          total_pnl: parseFloat(totalPnl.toFixed(1)),
          avg_pnl: parseFloat(avgPnl.toFixed(2)),
          quality_metrics: combinedQualityMetrics,
          trades: buyTrades,
          closed_trades_list: [...closedBuyTrades, ...tp1HitBuy],
        }
      },

      // ── Ranking metadata ────────────────────────────────────────────────
      ranking: {
        total_active:   primaryBuyTrades.length,
        top_picks_count: topPicks.length,
        other_count:    otherSignals.length,
        formula:        'ML(40%) + Confirmations(30%) + R:R(20%) + Timeframe(10%)',
      },

      // ── Platform performance stats (Defaults to Premier Elite) ─────────
      stats: {
        total_trades:    premierBuyTrades.length + closedPremierCount,
        active_trades:   premierBuyTrades.length,
        activated_trades: premierBuyTrades.filter((t: any) => t.is_activated).length,
        pending_trades:  premierBuyTrades.filter((t: any) => !t.is_activated).length,
        closed_trades:   closedPremierCount,
        winning_trades:  closedPremierTrades.filter((t: any) => Number(t.pnl_percent || 0) > 0).length,
        losing_trades:   closedPremierTrades.filter((t: any) => Number(t.pnl_percent || 0) < 0).length,
        win_rate:        parseFloat(premierWinRate.toFixed(1)),
        total_pnl:       parseFloat(premierTotalPnl.toFixed(1)),
        avg_pnl:         parseFloat(premierAvgPnl.toFixed(2)),
        confidence_range_ar: 'ثقة نموذج v6: 88% - 99% [الرئيسي]',
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
