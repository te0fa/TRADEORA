'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Download, TrendingUp, TrendingDown, ShieldAlert, Award, Calendar, Layers, Filter, ExternalLink, Loader2 } from 'lucide-react';
import { useLocale } from 'next-intl';

interface TradeItem {
  id: string;
  symbol: string;
  entry_price: number;
  target_price_1: number;
  target_price_2: number;
  stop_loss: number;
  confidence_score?: number;
  ml_probability?: number;
  rationale_ar?: string;
  trade_type: 'BUY' | 'SELL' | 'HOLD';
  timeframe: string;
  fair_value?: number;
  upside_potential?: number;
  dividend_yield?: number;
  rebound_support_price?: number;
  action_recommendation_ar?: string;
  company?: {
    symbol: string;
    name_ar?: string;
    name_en?: string;
    sector?: string;
  };
}

interface DailyReportProps {
  data: {
    report_date: string;
    available_dates?: string[];
    market_overview: {
      egx30_value: number;
      egx30_change: number;
      gaining_companies: number;
      losing_companies: number;
      unchanged_companies: number;
      total_analyzed: number;
    };
    buy_opportunities: TradeItem[];
    sell_caution_opportunities: TradeItem[];
  };
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  isLoadingDate?: boolean;
}

export function DailyReportView({ data, selectedDate, onDateChange, isLoadingDate }: DailyReportProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { report_date, available_dates = [], market_overview, buy_opportunities, sell_caution_opportunities } = data;

  const [reportScope, setReportScope] = useState<'TOP_PICKS' | 'ALL_MARKET'>('TOP_PICKS');
  const [selectedSector, setSelectedSector] = useState<string>('all');

  // Available sectors list for filtering
  const allSectors = useMemo(() => {
    const sSet = new Set<string>();
    [...buy_opportunities, ...sell_caution_opportunities].forEach(item => {
      if (item.company?.sector) sSet.add(item.company.sector);
    });
    return ['all', ...Array.from(sSet)];
  }, [buy_opportunities, sell_caution_opportunities]);

  // Filtered lists by scope and sector
  const filteredBuy = useMemo(() => {
    let list = buy_opportunities;
    if (reportScope === 'TOP_PICKS') {
      list = list.slice(0, 10);
    }
    if (selectedSector === 'all') return list;
    return list.filter(item => item.company?.sector === selectedSector);
  }, [buy_opportunities, reportScope, selectedSector]);

  const filteredSell = useMemo(() => {
    let list = sell_caution_opportunities;
    if (reportScope === 'TOP_PICKS') {
      list = list.slice(0, 10);
    }
    if (selectedSector === 'all') return list;
    return list.filter(item => item.company?.sector === selectedSector);
  }, [sell_caution_opportunities, reportScope, selectedSector]);

  const handlePrintPDF = () => {
    window.print();
  };

  const currentDateDisplay = selectedDate || report_date;
  const totalMarketSignalsCount = buy_opportunities.length + sell_caution_opportunities.length;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 pb-16 font-sans">
      
      {/* Action Header bar (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-900/80 border border-cyan-500/20 p-5 rounded-3xl gap-4 print:hidden backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {isAr ? 'التقرير اليومي لفرص وتوصيات البورصة المصرية' : 'EGX Daily Trade Opportunities Report'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'عرض الصفقات الموصى بها حسب تاريخ الجلسة مع مستويات الدخول والارباح ووقف الخسارة' : 'Session-by-session recommendations with target & stop levels'}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrintPDF}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          {isAr ? 'تحميل التقرير اليومي PDF' : 'Download PDF Report'}
        </button>
      </div>

      {/* Scope Selector Bar: Top Picks vs Full Market Database (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 bg-gradient-to-r from-amber-500/15 via-cyan-500/15 to-blue-600/15 border border-amber-500/30 rounded-2xl gap-3 print:hidden backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportScope('TOP_PICKS')}
            className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
              reportScope === 'TOP_PICKS'
                ? 'bg-amber-400 text-slate-950 shadow-lg font-black'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>👑 {isAr ? 'صفقات النخبة الذهبية (الأعلى ثقة ودقة)' : 'Premier Top Picks'}</span>
          </button>

          <button
            onClick={() => setReportScope('ALL_MARKET')}
            className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
              reportScope === 'ALL_MARKET'
                ? 'bg-cyan-500 text-slate-950 shadow-lg font-black'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🌐 {isAr ? `عرض كنز صفقات السوق الكامل (${totalMarketSignalsCount} سهم)` : `Full Market Database (${totalMarketSignalsCount})`}</span>
          </button>
        </div>

        <span className="text-[11px] text-amber-200/90 font-medium px-2">
          {reportScope === 'TOP_PICKS' 
            ? (isAr ? '✨ العرض الموصى به: يعرض أقوى الصفقات فقط لحفظ تركيزك' : 'Recommended: Shows top picks for optimal focus')
            : (isAr ? '🌐 الوضع المتقدم: يعرض قاعدة بيانات صفقات البورصة الكاملة' : 'Advanced Mode: Full market signals database')}
        </span>
      </div>

      {/* Date Picker Bar - Interactive Day-by-Day Selection (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/90 border border-white/10 p-4 rounded-2xl gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-cyan-400 shrink-0" />
          <span className="text-xs font-bold text-slate-200">
            {isAr ? '📅 اختيار تاريخ التقرير والجلسة:' : '📅 Select Session Report Date:'}
          </span>
          
          <input
            type="date"
            value={currentDateDisplay}
            onChange={(e) => onDateChange?.(e.target.value)}
            className="bg-black/60 border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
          />

          {isLoadingDate && (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin ml-2" />
          )}
        </div>

        {/* Quick Date Pills */}
        {available_dates.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium">{isAr ? 'جلسات سابقة:' : 'Available Sessions:'}</span>
            {available_dates.slice(0, 5).map((d: string) => (
              <button
                key={d}
                onClick={() => onDateChange?.(d)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                  currentDateDisplay === d
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:border-cyan-500/30'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sector Filter Dropdown (Hidden on Print) */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5 print:hidden">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>{isAr ? 'تصفية الفرص حسب القطاع:' : 'Filter Opportunities by Sector:'}</span>
        </span>
        <div className="flex flex-wrap gap-2">
          {allSectors.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedSector === sec
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-extrabold shadow-md'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:border-cyan-500/40'
              }`}
            >
              {sec === 'all' ? (isAr ? '🌐 كل القطاعات' : 'All Sectors') : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Risk Management & Execution Strategy Guide Banner */}
      <div className="bg-slate-900/80 border border-amber-500/30 p-4 rounded-2xl flex items-start sm:items-center gap-3 print:hidden backdrop-blur-md">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-xs">
          <span className="font-extrabold text-white block">
            {isAr ? '🛡️ إرشادات تنفيذ التصفية التأمينية (قاعدة 50 / 50):' : '🛡️ Secured Execution Guide (50/50 Rule):'}
          </span>
          <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
            {isAr 
              ? 'عند وصول سعر السهم للهدف الأول (TP1): يُوصى ببيع 50% من كمية أسهمك وجني الربح الأول، وتأمين النصف المتبقي بنقل الاستوب فوراً إلى سعر الدخول. وعند الوصول للهدف الثاني (TP2): يتم بيع الـ 50% المتبقية لحصد الربح الكامل.'
              : 'At TP1: Sell 50% position to lock first gain & move SL to entry price. At TP2: Sell remaining 50% to maximize profit.'}
          </p>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div id="printable-report" className="glass-card p-6 sm:p-10 rounded-3xl border border-white/10 text-slate-100 print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
        
        {/* BRANDING HEADER WITH TRADEORA LOGO */}
        <div className="flex items-center justify-between border-b border-white/10 print:border-black/20 pb-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl print:border print:border-black">
              T
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white print:text-black flex items-center gap-2">
                TRADEORA <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 print:border-black">AI QUANT</span>
              </h1>
              <p className="text-xs text-slate-400 print:text-gray-600">
                {isAr ? 'المنصة الذكية للتحليل الكمي وتحديد السعر العادل وتوصيات الشراء والبيع' : 'AI Quantitative Stock Intelligence & Target Valuation'}
              </p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <span className="text-xs font-mono font-semibold text-slate-400 print:text-gray-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              {currentDateDisplay}
            </span>
            <span className="text-[10px] font-bold text-emerald-400 print:text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded mt-1 border border-emerald-500/20">
              {isAr ? 'تقرير تداول معتمد' : 'Verified Daily Report'}
            </span>
          </div>
        </div>

        {/* MARKET OVERVIEW BANNER */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/10 print:border-black/20 print:bg-gray-50 mb-8">
          <div>
            <span className="text-[11px] text-slate-400 print:text-gray-600 block">{isAr ? 'مؤشر EGX 30' : 'EGX 30 Index'}</span>
            <span className="text-lg font-mono font-bold text-white print:text-black block">
              {market_overview.egx30_value.toLocaleString()}
            </span>
            <span dir="ltr" className={`text-xs font-bold font-mono inline-block ${market_overview.egx30_change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {market_overview.egx30_change >= 0 ? `+${market_overview.egx30_change.toFixed(2)}%` : `${market_overview.egx30_change.toFixed(2)}%`}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 print:text-gray-600 block">{isAr ? 'الأسهم الصاعدة' : 'Gaining Stocks'}</span>
            <span className="text-lg font-bold text-emerald-400 print:text-emerald-700 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {market_overview.gaining_companies}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 print:text-gray-600 block">{isAr ? 'الأسهم الهابطة' : 'Losing Stocks'}</span>
            <span className="text-lg font-bold text-rose-400 print:text-red-700 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {market_overview.losing_companies}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-slate-400 print:text-gray-600 block">{isAr ? 'إجمالي الفرص للجلسة' : 'Extracted Opportunities'}</span>
            <span className="text-lg font-mono font-bold text-cyan-400 print:text-blue-700 flex items-center gap-1">
              <Layers className="w-4 h-4" />
              {buy_opportunities.length + sell_caution_opportunities.length}
            </span>
          </div>
        </div>

        {/* SECTION 1: BUY OPPORTUNITIES */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 print:border-black/20 pb-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
            <h2 className="text-xl font-black text-white print:text-black">
              {isAr ? `أولاً: صفقات فرز وتوصيات الشراء والارتداد (${filteredBuy.length})` : `First: Buy Opportunities (${filteredBuy.length})`}
            </h2>
          </div>

          {filteredBuy.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">{isAr ? 'لا توجد صفقات شراء مسجلة لهذه الجلسة في القطاع المحدد.' : 'No buy opportunities found for this session date.'}</p>
          ) : (
            <div className="space-y-4">
              {filteredBuy.map((item, idx) => (
                <div key={item.id || item.symbol} className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 print:border-black/20 print:bg-white flex flex-col gap-3 group">
                  
                  {/* Top Info Bar with Clickable Stock Link */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-cyan-500/15 text-cyan-400 font-bold text-xs flex items-center justify-center print:border print:border-black">
                        #{idx + 1}
                      </span>
                      
                      <Link 
                        href={`/${locale}/stock/${item.symbol}`}
                        className="group/title flex items-center gap-2 text-white hover:text-cyan-400 transition cursor-pointer"
                      >
                        <span className="font-bold text-base print:text-black group-hover/title:text-cyan-400 transition-colors">
                          {item.company?.name_ar || item.company?.name_en || item.symbol}
                        </span>
                        <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 group-hover/title:bg-cyan-500/20">
                          {item.symbol}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-cyan-400/60 group-hover/title:text-cyan-400 transition-colors print:hidden" />
                      </Link>

                      {item.company?.sector && (
                        <span className="text-xs text-slate-400 print:text-gray-600">
                          ({item.company.sector})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        🟢 {isAr ? 'توصية شراء (Long)' : 'BUY'} ({Math.round((item.ml_probability || item.confidence_score || 0.82) * 100)}% {isAr ? 'ثقة' : 'Conf'})
                      </span>
                      <Link
                        href={`/${locale}/stock/${item.symbol}`}
                        className="text-xs font-bold text-cyan-400 hover:text-white bg-white/5 hover:bg-cyan-500/20 px-3 py-1 rounded-xl border border-white/10 transition print:hidden"
                      >
                        {isAr ? 'عرض التحليل والتفاصيل ➔' : 'View Details ➔'}
                      </Link>
                    </div>
                  </div>

                  {/* PRICE & TARGETS METRICS GRID */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl bg-white/5 print:bg-gray-100 border border-white/5 print:border-black/10 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'سعر الدخول المقترح' : 'Entry Price'}</span>
                      <span className="font-bold text-white print:text-black">{Number(item.entry_price).toFixed(2)} EGP</span>
                    </div>
                    <div>
                      <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'مستوى الارتداد/الدعم' : 'Bounce Level'}</span>
                      <span className="font-bold text-cyan-400">{item.rebound_support_price ? Number(item.rebound_support_price).toFixed(2) : (Number(item.entry_price) * 0.98).toFixed(2)} EGP</span>
                    </div>
                    <div>
                      <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'الهدف الأول TP1' : 'Target 1'}</span>
                      <span className="font-bold text-emerald-400">{Number(item.target_price_1).toFixed(2)} EGP</span>
                    </div>
                    <div>
                      <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'الهدف الثاني TP2' : 'Target 2'}</span>
                      <span className="font-bold text-emerald-400">{Number(item.target_price_2).toFixed(2)} EGP</span>
                    </div>
                    <div>
                      <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'وقف الخسارة SL' : 'Stop Loss'}</span>
                      <span className="font-bold text-rose-400">{Number(item.stop_loss).toFixed(2)} EGP</span>
                    </div>
                  </div>

                  {/* AI RATIONALE EXPLANATION */}
                  {item.rationale_ar && (
                    <div className="text-xs text-slate-300 print:text-gray-700 bg-cyan-500/[0.04] p-3 rounded-xl border border-cyan-500/10 print:border-black/10">
                      <span className="font-bold text-cyan-400 print:text-blue-700 block mb-1">
                        💡 {isAr ? 'سبب التوصية ونقطة الارتداد المتوقعة:' : 'Rebound & Buy Rationale:'}
                      </span>
                      {item.rationale_ar}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: SELL / CAUTION OPPORTUNITIES (DETAILED METRICS) */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 border-b border-white/10 print:border-black/20 pb-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-400" />
            <h2 className="text-xl font-black text-white print:text-black">
              {isAr ? `ثانياً: فرص وتنبيهات البيع والتخفيف والخروج (${filteredSell.length})` : `Second: Profit Taking & Exit Opportunities (${filteredSell.length})`}
            </h2>
          </div>

          {filteredSell.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">{isAr ? 'لا توجد توصيات بيع أو خروج مسجلة لهذه الجلسة.' : 'No sell or exit warnings for this session.'}</p>
          ) : (
            <div className="space-y-4">
              {filteredSell.map((item, idx) => {
                const entryPrice = Number(item.entry_price || 0);
                const reboundPrice = item.rebound_support_price ? Number(item.rebound_support_price) : Number((entryPrice * 1.015).toFixed(2));
                const target1 = item.target_price_1 ? Number(item.target_price_1) : Number((entryPrice * 0.94).toFixed(2));
                const target2 = item.target_price_2 ? Number(item.target_price_2) : Number((entryPrice * 0.88).toFixed(2));
                const stopLoss = item.stop_loss ? Number(item.stop_loss) : Number((entryPrice * 1.03).toFixed(2));

                return (
                  <div key={item.id || item.symbol} className="p-5 rounded-2xl bg-slate-900/40 border border-rose-500/20 print:border-black/20 print:bg-white flex flex-col gap-3 group">
                    
                    {/* Header bar for Sell Item with Link */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-400 font-bold text-xs flex items-center justify-center print:border print:border-black">
                          #{idx + 1}
                        </span>
                        
                        <Link 
                          href={`/${locale}/stock/${item.symbol}`}
                          className="group/title flex items-center gap-2 text-white hover:text-rose-400 transition cursor-pointer"
                        >
                          <span className="font-bold text-base print:text-black group-hover/title:text-rose-400 transition-colors">
                            {item.company?.name_ar || item.company?.name_en || item.symbol}
                          </span>
                          <span className="font-mono font-bold text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 group-hover/title:bg-rose-500/20">
                            {item.symbol}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-rose-400/60 group-hover/title:text-rose-400 transition-colors print:hidden" />
                        </Link>

                        {item.company?.sector && (
                          <span className="text-xs text-slate-400 print:text-gray-600">
                            ({item.company.sector})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                          🔴 {isAr ? 'توصية بيع / خروج' : 'SELL / EXIT'} ({Math.round((item.ml_probability || item.confidence_score || 0.78) * 100)}% {isAr ? 'ثقة' : 'Conf'})
                        </span>
                        <Link
                          href={`/${locale}/stock/${item.symbol}`}
                          className="text-xs font-bold text-rose-400 hover:text-white bg-white/5 hover:bg-rose-500/20 px-3 py-1 rounded-xl border border-white/10 transition print:hidden"
                        >
                          {isAr ? 'عرض التحليل والتفاصيل ➔' : 'View Details ➔'}
                        </Link>
                      </div>
                    </div>

                    {/* DETAILED SELL METRICS GRID */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl bg-white/5 print:bg-gray-100 border border-white/5 print:border-black/10 text-xs font-mono">
                      <div>
                        <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'سعر الخروج والتصفية' : 'Exit Price'}</span>
                        <span className="font-bold text-white print:text-black">{entryPrice.toFixed(2)} EGP</span>
                      </div>
                      <div>
                        <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'سعر الارتداد للتخفيف' : 'Bounce Exit Target'}</span>
                        <span className="font-bold text-amber-400">{reboundPrice.toFixed(2)} EGP</span>
                      </div>
                      <div>
                        <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'مستهدف الهبوط الأول' : 'Downside TP1'}</span>
                        <span className="font-bold text-rose-400">{target1.toFixed(2)} EGP</span>
                      </div>
                      <div>
                        <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'مستهدف الهبوط الثاني' : 'Downside TP2'}</span>
                        <span className="font-bold text-rose-400">{target2.toFixed(2)} EGP</span>
                      </div>
                      <div>
                        <span className="text-slate-400 print:text-gray-600 block">{isAr ? 'شرط إلغاء الهبوط' : 'Downside Stop'}</span>
                        <span className="font-bold text-cyan-400">{stopLoss.toFixed(2)} EGP</span>
                      </div>
                    </div>

                    {/* Detailed Exit Guidance & Strategy */}
                    <div className="text-xs text-rose-200 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                      <span className="font-bold block mb-1">
                        ⚠️ {isAr ? 'توصية الخروج ومستويات الارتداد لتقليل الخسارة:' : 'Exit Action Guidance:'}
                      </span>
                      {item.action_recommendation_ar || item.rationale_ar || (isAr ? 'السهم في اتجاه هابط مستمر؛ يُفضل التخفيف والخروج عند أي ارتداد مؤقت لحين استقرار القاع.' : 'Exit position on temporary bounce.')}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* REPORT FOOTER WITH BRAND DISCLAIMER */}
        <div className="border-t border-white/10 print:border-black/20 pt-6 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 print:text-gray-600 gap-3">
          <div>
            <span>© {new Date().getFullYear()} TRADEORA Quantitative Intelligence. </span>
            <span>{isAr ? 'جميع التوصيات مبنية على خوارزميات كمية ونماذج الذكاء الاصطناعي.' : 'All metrics derived from AI Quantitative models.'}</span>
          </div>
          <div className="font-mono font-bold text-cyan-400">
            www.tradeora.ai
          </div>
        </div>

      </div>
    </div>
  );
}
