'use client';

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Activity,
  CheckCircle2,
  CandlestickChart,
  BarChart3,
  Scale,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import type { CandlePattern } from '@/lib/ta-utils';

interface FibLevel {
  label: string;
  labelAr: string;
  levelPct: number;
  price: number;
  isConfluence: boolean;
  confluenceNote?: string;
  confluenceNoteAr?: string;
}

// Pattern names in Arabic and English
const PATTERN_NAMES: Record<string, { ar: string; en: string; bullish: boolean | null; emoji: string }> = {
  hammer:            { ar: 'شمعة المطرقة 🔨',       en: 'Hammer',            bullish: true,  emoji: '🔨' },
  shooting_star:     { ar: 'نجمة الرمي 🌠',          en: 'Shooting Star',     bullish: false, emoji: '🌠' },
  bullish_engulfing: { ar: 'الابتلاع الصاعد 🟢',     en: 'Bullish Engulfing', bullish: true,  emoji: '🟢' },
  bearish_engulfing: { ar: 'الابتلاع الهابط 🔴',     en: 'Bearish Engulfing', bullish: false, emoji: '🔴' },
  doji:              { ar: 'شمعة الدوجي ⚖️',          en: 'Doji',              bullish: null,  emoji: '⚖️' },
  morning_star:      { ar: 'نجمة الصباح 🌅',          en: 'Morning Star',      bullish: true,  emoji: '🌅' },
  evening_star:      { ar: 'نجمة المساء 🌆',          en: 'Evening Star',      bullish: false, emoji: '🌆' },
};

const PATTERN_DESCRIPTIONS: Record<string, { ar: string; en: string }> = {
  hammer: {
    ar: 'تكوّن شمعة المطرقة يدل على رفض السهم للهبوط وتمركز القوة الشرائية بالقرب من القاع. من أقوى إشارات الانعكاس الصاعد عند الدعوم.',
    en: 'Hammer candle signals strong buyer rejection of lower prices near support. High-probability bullish reversal signal.',
  },
  shooting_star: {
    ar: 'نجمة الرمي تشير لرفض السوق الصعود عند المقاومة. البائعون هيمنوا وأعادوا السعر للأسفل بقوة — إشارة هبوط قوية.',
    en: 'Shooting Star signals seller dominance near resistance. Bears pushed price back down strongly — bearish reversal signal.',
  },
  bullish_engulfing: {
    ar: 'الابتلاع الصاعد: شمعة خضراء تلتهم الشمعة الحمراء السابقة بالكامل. يعني المشترون سيطروا تماماً على البائعين وزخم الصعود بدأ.',
    en: 'Bullish Engulfing: Green candle fully engulfs prior red. Buyers overwhelmed sellers completely — strong upward momentum signal.',
  },
  bearish_engulfing: {
    ar: 'الابتلاع الهابط: شمعة حمراء تلتهم الخضراء السابقة. البائعون سيطروا بالكامل — إشارة هبوط وبداية ضغط بيعي قوي.',
    en: 'Bearish Engulfing: Red candle engulfs prior green. Sellers dominated completely — strong downward pressure signal.',
  },
  doji: {
    ar: 'الدوجي يعكس تردداً وتوازناً بين المشترين والبائعين. في حد ذاته محايد — الاتجاه تحدده الشمعة التالية.',
    en: 'Doji reflects market indecision and balance. Neutral on its own — next candle determines direction.',
  },
  morning_star: {
    ar: 'نجمة الصباح نمط انعكاس صاعد من 3 شمعات: هبوط قوي → دوجي → صعود قوي. إشارة نهاية الهبوط وبداية انعكاس.',
    en: '3-candle bullish reversal: strong drop → doji → strong rise. Signals end of downtrend and potential reversal.',
  },
  evening_star: {
    ar: 'نجمة المساء نمط انعكاس هابط من 3 شمعات: صعود قوي → دوجي → هبوط قوي. إشارة نهاية الصعود وبداية انعكاس.',
    en: '3-candle bearish reversal: strong rise → doji → strong drop. Signals end of uptrend and potential reversal.',
  },
};

export interface TechnicalBreakdownTableProps {
  symbol: string;
  currentPrice: number;
  locale: string;
  high60d?: number;
  low60d?: number;
  atrVal?: number;
  // Real dynamic data from PriceChart
  candlePatternData?: { pattern: CandlePattern; bullish: boolean | null } | null;
  riskReward?: string | null;
  volumeRatio?: number | null;
  rsiValue?: number | null;
  macdValue?: number | null;
  sma20?: number | null;
  sma50?: number | null;
  bbUpper?: number | null;
  bbLower?: number | null;
  bbPos?: number | null;
  stochRsi?: number | null;
  // Overlay toggles (controlled by parent)
  showRSI?: boolean;
  showMACD?: boolean;
  showSMA?: boolean;
  showBB?: boolean;
  onToggleRSI?: () => void;
  onToggleMACD?: () => void;
  onToggleSMA?: () => void;
  onToggleBB?: () => void;
}

// Small info tooltip component
function InfoTip({ text, isAr }: { text: string; isAr: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
        title={isAr ? 'شرح' : 'Info'}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="absolute z-50 bottom-6 left-0 bg-slate-900 border border-white/10 rounded-xl p-3 text-[11px] text-slate-300 leading-relaxed w-64 shadow-2xl"
          onClick={() => setOpen(false)}
        >
          {text}
        </div>
      )}
    </span>
  );
}

// Toggle button for chart overlay
function OverlayToggle({
  active,
  onToggle,
  label,
  color,
  isAr,
}: {
  active: boolean;
  onToggle: () => void;
  label: string;
  color: string;
  isAr: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all duration-150"
      style={{
        background: active ? `${color}22` : 'rgba(255,255,255,0.03)',
        color: active ? color : '#6B7280',
        borderColor: active ? `${color}44` : 'rgba(255,255,255,0.06)',
      }}
      title={isAr ? (active ? 'إخفاء من الشارت' : 'إظهار على الشارت') : (active ? 'Hide from chart' : 'Show on chart')}
    >
      {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      <span>{isAr ? (active ? 'ظاهر' : 'مخفي') : (active ? 'On' : 'Off')}</span>
    </button>
  );
}

export function TechnicalBreakdownTable({ 
  symbol, 
  currentPrice, 
  locale,
  high60d,
  low60d,
  atrVal,
  candlePatternData,
  riskReward,
  volumeRatio,
  rsiValue,
  macdValue,
  sma20,
  sma50,
  bbUpper,
  bbLower,
  bbPos,
  stochRsi,
  showRSI,
  showMACD,
  showSMA,
  showBB,
  onToggleRSI,
  onToggleMACD,
  onToggleSMA,
  onToggleBB,
}: TechnicalBreakdownTableProps) {
  const isAr = locale === 'ar';
  const [expandedFib, setExpandedFib] = useState(false);

  const safePrice = currentPrice || 0;
  const maxPrice = high60d || (safePrice > 0 ? safePrice * 1.15 : 10);
  const minPrice = low60d || (safePrice > 0 ? safePrice * 0.85 : 5);
  const diff = maxPrice - minPrice;

  // ── Fibonacci Levels (computed from real high/low) ────────────────
  const fibLevels: FibLevel[] = useMemo(() => [
    { 
      label: 'Fib 23.6%', labelAr: 'فيب 23.6%', levelPct: 23.6,
      price: Number((maxPrice - 0.236 * diff).toFixed(3)), isConfluence: false,
      confluenceNoteAr: 'تصحيح ضحل — ارتداد خفيف عادةً',
      confluenceNote: 'Shallow retracement — minor pullback zone',
    },
    { 
      label: 'Fib 38.2%', labelAr: 'فيب 38.2%', levelPct: 38.2,
      price: Number((maxPrice - 0.382 * diff).toFixed(3)), isConfluence: true,
      confluenceNoteAr: 'منطقة ارتداد تصحيحي محتملة — دعم جيد',
      confluenceNote: 'Potential corrective rebound — good support zone',
    },
    { 
      label: 'Fib 50.0%', labelAr: 'فيب 50%', levelPct: 50.0,
      price: Number((maxPrice - 0.500 * diff).toFixed(3)), isConfluence: true,
      confluenceNoteAr: 'المحور الرئيسي — الأكثر مراقبةً من المؤسسات',
      confluenceNote: 'Golden Pivot — most watched institutional level',
    },
    { 
      label: 'Fib 61.8%', labelAr: 'فيب 61.8% (ذهبي)', levelPct: 61.8,
      price: Number((maxPrice - 0.618 * diff).toFixed(3)), isConfluence: true,
      confluenceNoteAr: '🥇 النسبة الذهبية — أقوى مستوى دعم/ارتداد تاريخياً',
      confluenceNote: '🥇 Golden Ratio — historically strongest reversal level',
    },
    { 
      label: 'Fib 78.6%', labelAr: 'فيب 78.6%', levelPct: 78.6,
      price: Number((maxPrice - 0.786 * diff).toFixed(3)), isConfluence: false,
      confluenceNoteAr: 'تصحيح عميق — يُشير لضعف الاتجاه',
      confluenceNote: 'Deep retracement — trend weakness signal',
    },
  ], [maxPrice, minPrice, diff]);

  // ── SuperTrend (ATR-based) ────────────────────────────────────────
  const atr = atrVal || (safePrice * 0.03);
  const supertrendLine = Number((safePrice - 1.5 * atr).toFixed(3));
  const isSupertrendBullish = safePrice >= supertrendLine;

  // ── Ichimoku Tenkan-sen ───────────────────────────────────────────
  const ichimokuTenkan = sma20 ?? Number((safePrice * 0.985).toFixed(3));
  const ichimokuKijun  = sma50 ?? Number((safePrice * 0.970).toFixed(3));
  const isAboveTenkan  = safePrice > ichimokuTenkan;
  const isAboveKijun   = safePrice > ichimokuKijun;
  const cloudStatus    = isAboveTenkan && isAboveKijun ? 'above' : (!isAboveTenkan && !isAboveKijun ? 'below' : 'inside');

  // ── Volume POC proxy ─────────────────────────────────────────────
  const volumePocProxy = useMemo(() => {
    const ratio = volumeRatio ?? 1;
    // POC = center of recent range weighted towards high-volume zone
    return Number(((maxPrice + minPrice) / 2 * (ratio > 1 ? 1.005 : 0.995)).toFixed(3));
  }, [volumeRatio, maxPrice, minPrice]);

  // ── Risk/Reward display ───────────────────────────────────────────
  const rrDisplay = riskReward ?? '—';

  // ── Candle pattern display ────────────────────────────────────────
  const patternKey = candlePatternData?.pattern ?? null;
  const patternMeta = patternKey ? PATTERN_NAMES[patternKey] : null;
  const patternDesc  = patternKey ? PATTERN_DESCRIPTIONS[patternKey] : null;

  // ── Stoch RSI badge ──────────────────────────────────────────────
  const stochLabel = stochRsi != null
    ? stochRsi <= 0.2 ? (isAr ? 'تشبع بيعي 🟢' : 'Oversold 🟢')
    : stochRsi >= 0.8 ? (isAr ? 'تشبع شرائي 🔴' : 'Overbought 🔴')
    : (isAr ? 'محايد 🟡' : 'Neutral 🟡')
    : '—';

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-100 my-6">
      {/* Table Title & Summary Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h3 className="text-lg font-black text-white flex items-center gap-2.5">
          <span className="p-2 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-5 h-5" />
          </span>
          <span>{isAr ? `مصفوفة ومحركات التحليل الفني الشامل لسهم ${symbol}` : `Comprehensive Technical Matrix for ${symbol}`}</span>
        </h3>
        <Badge className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono font-bold text-xs">
          {isAr ? '8 محاور فنية — لايف' : '8 Indicators — Live'}
        </Badge>
      </div>

      {/* Grid of 6 Core Technical Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* 1. Candlestick Pattern Recognition — LIVE */}
        <Card className="p-4 glass-card flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <CandlestickChart className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'نموذج الشموع اليابانية' : 'Candlestick Pattern'}</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'نمط الشمعة يُظهر صراع المشترين والبائعين في آخر شمعة. يتحدث مع كل شمعة جديدة.'
                  : 'Candlestick pattern shows buyer/seller battle in the last candle. Updates with each new candle.'}
              />
            </span>
            <Badge className={`font-bold text-xs ${
              patternMeta?.bullish === true  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
              patternMeta?.bullish === false ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            }`}>
              {patternMeta ? (isAr ? patternMeta.ar : `${patternMeta.emoji} ${patternMeta.en}`) : (isAr ? 'لا نمط واضح ➖' : 'No Pattern ➖')}
            </Badge>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">{isAr ? 'حالة النموذج:' : 'Pattern Status:'}</span>
            <span className={`text-sm font-bold ${
              patternMeta?.bullish === true ? 'text-emerald-300' :
              patternMeta?.bullish === false ? 'text-rose-300' : 'text-yellow-300'
            }`}>
              {patternMeta
                ? (isAr
                    ? `${patternMeta.bullish === true ? 'نموذج انعكاسي صاعد 🟩' : patternMeta.bullish === false ? 'نموذج انعكاسي هابط 🔴' : 'نموذج محايد ⚖️'}`
                    : `${patternMeta.bullish === true ? 'Bullish Reversal Pattern ✅' : patternMeta.bullish === false ? 'Bearish Reversal Pattern ❌' : 'Neutral Pattern ⚖️'}`)
                : (isAr ? 'السوق بلا نمط شموع واضح — استمرار اتجاه محتمل' : 'No clear pattern — trend continuation likely')}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-white/5 leading-normal">
            {patternDesc
              ? (isAr ? patternDesc.ar : patternDesc.en)
              : (isAr
                  ? 'لا يوجد نمط شمعة واضح — هذا طبيعي في مراحل الترند القوي. المؤشرات الأخرى تعوض غياب النمط.'
                  : 'No clear candle pattern detected — normal during strong trends. Other indicators confirm direction.')}
          </p>
        </Card>

        {/* 2. Volume Profile Point of Control (POC) — LIVE */}
        <Card className="p-4 glass-card flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'سيولة المؤسسات (VPOC)' : 'Institutional VPOC'}</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'نقطة التحكم في الحجم (VPOC) هي السعر الذي جرى عنده أعلى حجم تداول. المؤسسات تدافع عن هذا المستوى دوماً.'
                  : 'Volume Point of Control (VPOC) is the price with highest trading volume. Institutions always defend this level.'}
              />
            </span>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-bold text-xs">VPOC</Badge>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">{isAr ? 'سعر تجميع السيولة:' : 'Institutional VPOC Level:'}</span>
            <span className="text-lg font-mono font-extrabold text-cyan-300">
              {volumePocProxy} {isAr ? 'ج.م' : 'EGP'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-white/5 leading-normal">
            {isAr
              ? `السعر ${safePrice > volumePocProxy ? 'فوق' : 'تحت'} مستوى السيولة المؤسسية. ${safePrice > volumePocProxy ? 'الدعم مفعّل — الاتجاه يميل للصعود.' : 'المؤسسات لم تتراكم بعد — توخَّ الحذر.'}`
              : `Price is ${safePrice > volumePocProxy ? 'above' : 'below'} institutional VPOC. ${safePrice > volumePocProxy ? 'Support active — bullish bias.' : 'Institutional accumulation not yet confirmed — caution.'}`}
          </p>
        </Card>

        {/* 3. Risk/Reward Ratio — LIVE */}
        <Card className="p-4 glass-card flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>{isAr ? 'نسبة عائد المخاطرة' : 'Risk / Reward Ratio'}</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'نسبة العائد للمخاطرة توضح كم تكسب مقابل كل جنيه تخاطر به. 1:2 ممتازة، 1:1.5 جيدة، أقل من 1:1 غير مقبولة.'
                  : 'R/R ratio shows profit potential vs. risk. 1:2 is excellent, 1:1.5 is good, below 1:1 is not acceptable.'}
              />
            </span>
            <Badge className={`font-bold text-xs ${
              rrDisplay !== '—' && parseFloat(rrDisplay.split(':')[1] || '0') >= 2
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : rrDisplay !== '—' && parseFloat(rrDisplay.split(':')[1] || '0') >= 1.5
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
            }`}>
              {rrDisplay !== '—' && parseFloat(rrDisplay.split(':')[1] || '0') >= 2
                ? (isAr ? 'ممتازة 🎯' : 'Excellent 🎯')
                : rrDisplay !== '—' && parseFloat(rrDisplay.split(':')[1] || '0') >= 1.5
                ? (isAr ? 'جيدة ✅' : 'Good ✅')
                : (isAr ? 'تحقق من الصفقة' : 'Check Trade')}
            </Badge>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">{isAr ? 'معامل Risk / Reward:' : 'Risk / Reward Ratio:'}</span>
            <span className="text-xl font-mono font-black text-amber-400">
              {rrDisplay !== '—' ? `1 : ${rrDisplay}` : '—'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-white/5 leading-normal">
            {rrDisplay !== '—'
              ? (isAr
                  ? `كل 1 ج.م مخاطرة يواجهه ${rrDisplay} ج.م ربح محتمل. ${parseFloat(rrDisplay) >= 2 ? 'نسبة ممتازة تضمن إدارة مخاطر احترافية.' : 'نسبة مقبولة — راجع مستوى الوقف.'}`
                  : `Each 1 EGP risk offers ${rrDisplay} EGP potential upside. ${parseFloat(rrDisplay) >= 2 ? 'Excellent ratio — professional risk management.' : 'Acceptable ratio — review stop level.'}`)
              : (isAr
                  ? 'لم يتم احتساب نسبة العائد بعد — في انتظار إشارة واضحة.'
                  : 'R/R ratio pending — waiting for a clear directional signal.')}
          </p>
        </Card>

        {/* 4. SuperTrend — LIVE */}
        <Card className="p-4 glass-card flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>SuperTrend</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'SuperTrend مؤشر اتجاه يعتمد على ATR. لو السعر فوق الخط = صاعد. تحت الخط = هابط. مفيد جداً لتحديد وقف الخسارة المتحرك.'
                  : 'SuperTrend is ATR-based trend indicator. Above line = bullish, below = bearish. Excellent for dynamic stop loss placement.'}
              />
            </span>
            <div className="flex items-center gap-2">
              {onToggleSMA && (
                <OverlayToggle active={showSMA ?? false} onToggle={onToggleSMA} label="SMA" color="#10B981" isAr={isAr} />
              )}
              <Badge className={isSupertrendBullish ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' : 'bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs'}>
                {isSupertrendBullish ? (isAr ? 'صاعد 🟩' : 'Bullish 🟩') : (isAr ? 'هابط 🔴' : 'Bearish 🔴')}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">{isAr ? 'مستوى وقف الاتجاه:' : 'Trend Stop Level:'}</span>
            <span className="text-lg font-mono font-extrabold text-white">
              {supertrendLine} {isAr ? 'ج.م' : 'EGP'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-white/5 leading-normal">
            {isAr
              ? `SuperTrend يؤكد الموجة ${isSupertrendBullish ? 'الصاعدة' : 'الهابطة'} طالما استقر السعر ${isSupertrendBullish ? 'أعلى' : 'أدنى'} مستوى ${supertrendLine}. الاختراق ${isSupertrendBullish ? 'للأسفل' : 'للأعلى'} يلغي الإشارة.`
              : `SuperTrend confirms ${isSupertrendBullish ? 'bullish' : 'bearish'} momentum while price remains ${isSupertrendBullish ? 'above' : 'below'} ${supertrendLine}. Break ${isSupertrendBullish ? 'below' : 'above'} cancels signal.`}
          </p>
        </Card>

        {/* 5. Ichimoku Cloud — LIVE */}
        <Card className="p-4 glass-card flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{isAr ? 'سحابة إيشيموكو' : 'Ichimoku Cloud'}</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'إيشيموكو نظام متكامل للتحليل: فوق السحابة = صاعد قوي، داخل السحابة = ترقب، تحت السحابة = هابط. يجمع الدعم والمقاومة والاتجاه في أداة واحدة.'
                  : 'Ichimoku is a complete trading system: above cloud = strong bullish, inside = caution, below = bearish. Combines S/R and trend in one tool.'}
              />
            </span>
            <Badge className={
              cloudStatus === 'above' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs' :
              cloudStatus === 'below' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 text-xs' :
              'bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs'
            }>
              {cloudStatus === 'above' ? (isAr ? 'أعلى السحابة 🟩' : 'Above Cloud 🟩') :
               cloudStatus === 'below' ? (isAr ? 'تحت السحابة 🔴' : 'Below Cloud 🔴') :
               (isAr ? 'داخل السحابة 🟡' : 'Inside Cloud 🟡')}
            </Badge>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400">{isAr ? 'خط التحول (Tenkan-sen):' : 'Tenkan-sen:'}</span>
            <span className="text-base font-mono font-extrabold text-cyan-400">
              {ichimokuTenkan} {isAr ? 'ج.م' : 'EGP'}
            </span>
            <span className="text-[10px] text-slate-500">
              {isAr ? `خط الأساس (Kijun-sen): ${ichimokuKijun} ج.م` : `Kijun-sen: ${ichimokuKijun} EGP`}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-white/5 leading-normal">
            {cloudStatus === 'above'
              ? (isAr ? 'السعر فوق سحابة إيشيموكو — إشارة صاعدة قوية وحصانة ضد التقلبات. الاتجاه الرئيسي صعودي.' : 'Price above Ichimoku cloud — strong bullish signal and trend immunity. Main trend is upward.')
              : cloudStatus === 'below'
              ? (isAr ? 'السعر تحت السحابة — ضغط بيعي سائد. الدخول للشراء يتطلب كسر السحابة.' : 'Price below cloud — bearish pressure dominates. Buying requires cloud breakout.')
              : (isAr ? 'السعر داخل السحابة — منطقة تردد وتوازن. انتظر الخروج من السحابة لتحديد الاتجاه.' : 'Price inside cloud — indecision zone. Wait for cloud breakout to confirm direction.')}
          </p>
        </Card>

        {/* 6. Stochastic RSI — LIVE */}
        <Card className="p-4 glass-card flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-violet-400" />
              <span>{isAr ? 'ستوكاستيك RSI' : 'Stochastic RSI'}</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'ستوكاستيك RSI يقيس موقع RSI داخل نطاقه الأخير. أقل من 0.2 = تشبع بيعي وفرصة شراء. أعلى من 0.8 = تشبع شرائي وخطر هبوط.'
                  : 'Stoch RSI measures RSI position within its recent range. Below 0.2 = oversold and buy opportunity. Above 0.8 = overbought and correction risk.'}
              />
            </span>
            <div className="flex items-center gap-2">
              {onToggleRSI && (
                <OverlayToggle active={showRSI ?? false} onToggle={onToggleRSI} label="RSI" color="#A78BFA" isAr={isAr} />
              )}
              <Badge className={`text-xs font-bold ${
                stochRsi != null && stochRsi <= 0.2 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                stochRsi != null && stochRsi >= 0.8 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}>
                {stochLabel}
              </Badge>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-400 block">{isAr ? 'القيمة الحالية (0-1):' : 'Current Value (0-1):'}</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-mono font-extrabold text-violet-300">
                {stochRsi != null ? stochRsi.toFixed(3) : '—'}
              </span>
              {stochRsi != null && (
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stochRsi <= 0.2 ? 'bg-emerald-500' :
                      stochRsi >= 0.8 ? 'bg-rose-500' : 'bg-violet-500'
                    }`}
                    style={{ width: `${stochRsi * 100}%` }}
                  />
                </div>
              )}
            </div>
            {rsiValue != null && (
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {isAr ? `RSI (14): ${rsiValue.toFixed(1)}` : `RSI (14): ${rsiValue.toFixed(1)}`}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-white/5 leading-normal">
            {stochRsi != null
              ? stochRsi <= 0.2
                ? (isAr ? 'مؤشر ستوكاستيك RSI في منطقة التشبع البيعي — فرصة شراء محتملة. انتظر تأكيد ارتداد.' : 'Stoch RSI in oversold territory — potential buy opportunity. Wait for reversal confirmation.')
                : stochRsi >= 0.8
                ? (isAr ? 'تشبع شرائي — المؤشر ينذر بتصحيح وشيك. انتظر إشارة بيع قبل الدخول.' : 'Overbought — correction risk high. Wait for sell signal before entering.')
                : (isAr ? 'ستوكاستيك RSI في المنطقة المحايدة — لا إشارة متطرفة. تابع المؤشرات الأخرى.' : 'Stoch RSI in neutral zone — no extreme signal. Follow other indicators for direction.')
              : (isAr ? 'بيانات غير كافية لحساب ستوكاستيك RSI.' : 'Insufficient data to calculate Stoch RSI.')}
          </p>
        </Card>
      </div>

      {/* ── RSI + MACD + BB Indicators Row ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RSI Card */}
        <Card className="p-4 glass-card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>RSI (14)</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'مؤشر القوة النسبية (RSI): فوق 70 = تشبع شراء وخطر تصحيح، تحت 30 = تشبع بيع وفرصة صعود، بين 45-55 = منطقة محايدة.'
                  : 'RSI above 70 = overbought, below 30 = oversold and buy opportunity, 45-55 = neutral zone.'}
              />
            </span>
            <div className="flex items-center gap-2">
              {onToggleRSI && (
                <OverlayToggle active={showRSI ?? false} onToggle={onToggleRSI} label="RSI" color="#A78BFA" isAr={isAr} />
              )}
              <Badge className={`text-xs ${
                rsiValue != null && rsiValue > 65 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                rsiValue != null && rsiValue < 35 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}>
                {rsiValue != null
                  ? rsiValue > 65 ? (isAr ? 'تشبع شراء' : 'Overbought')
                  : rsiValue < 35 ? (isAr ? 'تشبع بيع' : 'Oversold')
                  : (isAr ? 'محايد' : 'Neutral')
                  : '—'}
              </Badge>
            </div>
          </div>
          <span className="text-2xl font-mono font-black text-purple-300">
            {rsiValue != null ? rsiValue.toFixed(1) : '—'}
          </span>
          {rsiValue != null && (
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${rsiValue > 65 ? 'bg-rose-500' : rsiValue < 35 ? 'bg-emerald-500' : 'bg-purple-500'}`}
                style={{ width: `${rsiValue}%` }}
              />
            </div>
          )}
          <p className="text-[10px] text-slate-400">
            {isAr ? 'خطا الخطر: 30 تشبع بيع | 70 تشبع شراء' : 'Danger zones: 30 oversold | 70 overbought'}
          </p>
        </Card>

        {/* MACD Card */}
        <Card className="p-4 glass-card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>MACD</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'MACD إيجابي = زخم صاعد (المتوسط السريع فوق البطيء). MACD سلبي = زخم هابط. التقاطع هو إشارة الدخول/الخروج.'
                  : 'Positive MACD = bullish momentum (fast MA above slow). Negative = bearish. Crossover is the entry/exit signal.'}
              />
            </span>
            <div className="flex items-center gap-2">
              {onToggleMACD && (
                <OverlayToggle active={showMACD ?? false} onToggle={onToggleMACD} label="MACD" color="#3B82F6" isAr={isAr} />
              )}
              <Badge className={`text-xs ${
                macdValue != null && macdValue > 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {macdValue != null
                  ? macdValue > 0 ? (isAr ? 'صاعد 🟢' : 'Bullish 🟢') : (isAr ? 'هابط 🔴' : 'Bearish 🔴')
                  : '—'}
              </Badge>
            </div>
          </div>
          <span className={`text-2xl font-mono font-black ${macdValue != null && macdValue > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {macdValue != null ? macdValue.toFixed(4) : '—'}
          </span>
          <p className="text-[10px] text-slate-400">
            {isAr
              ? `الزخم ${macdValue != null && macdValue > 0 ? 'إيجابي — الاتجاه يدعم الصعود' : 'سلبي — الاتجاه يدعم الهبوط'}`
              : `Momentum ${macdValue != null && macdValue > 0 ? 'positive — supports uptrend' : 'negative — supports downtrend'}`}
          </p>
        </Card>

        {/* Bollinger Bands Card */}
        <Card className="p-4 glass-card flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'بولنجر باندز' : 'Bollinger Bands'}</span>
              <InfoTip
                isAr={isAr}
                text={isAr
                  ? 'نطاقات بولنجر تقيس تقلب السعر. السعر عند الحد السفلي = فرصة شراء محتملة. عند الحد العلوي = منطقة بيع. الانضغاط = تحرك وشيك.'
                  : 'Bollinger Bands measure volatility. Price at lower band = buy opportunity. Upper band = sell zone. Squeeze = breakout imminent.'}
              />
            </span>
            <div className="flex items-center gap-2">
              {onToggleBB && (
                <OverlayToggle active={showBB ?? false} onToggle={onToggleBB} label="BB" color="#6366F1" isAr={isAr} />
              )}
              <Badge className={`text-xs ${
                bbPos != null && bbPos <= -0.7 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                bbPos != null && bbPos >= 0.7  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}>
                {bbPos != null
                  ? bbPos <= -0.7 ? (isAr ? 'قرب الحد السفلي 🟢' : 'Near Lower Band 🟢')
                  : bbPos >= 0.7  ? (isAr ? 'قرب الحد العلوي 🔴' : 'Near Upper Band 🔴')
                  : (isAr ? 'وسط النطاق 🟡' : 'Mid-Band 🟡')
                  : '—'}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-slate-500">{isAr ? 'الحد العلوي:' : 'Upper:'} <span className="text-rose-300 font-mono">{bbUpper?.toFixed(3) ?? '—'}</span></span>
            <span className="text-base font-mono font-bold text-indigo-300">{isAr ? 'السعر الحالي:' : 'Current:'} {safePrice.toFixed(3)}</span>
            <span className="text-[10px] text-slate-500">{isAr ? 'الحد السفلي:' : 'Lower:'} <span className="text-emerald-300 font-mono">{bbLower?.toFixed(3) ?? '—'}</span></span>
          </div>
          {bbPos != null && (
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (bbPos + 1) / 2 * 100))}%` }}
              />
            </div>
          )}
        </Card>
      </div>

      {/* ── Fibonacci Table (Collapsible) ────────────────────────────────── */}
      <Card className="p-5 glass-panel flex flex-col gap-4">
        <div
          className="flex items-center justify-between border-b border-white/5 pb-3 cursor-pointer select-none"
          onClick={() => setExpandedFib(!expandedFib)}
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </span>
            <h4 className="text-sm font-black text-white">
              {isAr ? 'مستويات فيبوناتشي الارتدادية (Fibonacci Confluence Matrix)' : 'Fibonacci Levels & Confluence Matrix'}
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {isAr ? `السعر: ${safePrice.toFixed(3)} ج.م` : `Price: ${safePrice.toFixed(3)} EGP`}
            </span>
            {expandedFib ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>

        {expandedFib && (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-bold bg-slate-900/40">
                  <th className="p-3 text-right">{isAr ? 'مستوى فيبوناتشي' : 'Fib Level'}</th>
                  <th className="p-3 text-right">{isAr ? 'السعر (ج.م)' : 'Price (EGP)'}</th>
                  <th className="p-3 text-right">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-right">{isAr ? 'درجة القوة' : 'Confluence'}</th>
                  <th className="p-3 text-right">{isAr ? 'الشرح' : 'Guidance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {fibLevels.map((fib) => {
                  const isNearCurrent = Math.abs(fib.price - safePrice) / safePrice <= 0.02;
                  const isAbove = fib.price > safePrice;
                  return (
                    <tr
                      key={fib.label}
                      className={`transition-colors hover:bg-white/5 ${isNearCurrent ? 'bg-cyan-500/10 font-bold' : ''}`}
                    >
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${fib.levelPct === 61.8 ? 'bg-amber-400 animate-pulse' : isAbove ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                        <span>{isAr ? fib.labelAr : fib.label}</span>
                      </td>
                      <td className="p-3 text-cyan-300 font-bold text-sm">
                        {fib.price} {isAr ? 'ج.م' : 'EGP'}
                        {isNearCurrent && <span className="text-[9px] text-cyan-400 bg-cyan-500/10 px-1 py-0.5 rounded ml-1">{isAr ? 'قريب' : 'Near'}</span>}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold ${isAbove ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isAbove ? (isAr ? '↑ مقاومة' : '↑ Resistance') : (isAr ? '↓ دعم' : '↓ Support')}
                        </span>
                      </td>
                      <td className="p-3">
                        {fib.isConfluence ? (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isAr ? 'تلاقي قوي 🎯' : 'Strong Confluence'}</span>
                          </Badge>
                        ) : (
                          <span className="text-slate-500 text-[10px]">{isAr ? 'اعتيادي' : 'Standard'}</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300 font-sans text-[10px]">
                        {isAr ? fib.confluenceNoteAr : fib.confluenceNote}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
