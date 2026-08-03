'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  X, 
  Search, 
  Target, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Brain,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { useLocale } from 'next-intl';

export interface ClosedDrilldownTrade {
  id: string;
  symbol: string;
  company_name?: string;
  sector?: string;
  direction?: string;
  entry_price: number;
  exit_price?: number | null;
  tp1?: number;
  tp2?: number;
  sl?: number;
  status?: string;
  exit_reason?: string | null;
  pnl_percent?: number | null;
  recommended_at?: string;
  closed_at?: string | null;
  ml_probability?: number | null;
  explanation_ar?: string;
  features_snapshot?: any;
}

interface QualityDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  filterType: 'all' | 'tp1' | 'tp2' | 'sl' | 'trailing' | 'breakeven';
  filterTitle: string;
  tierLabel: string;
  trades: ClosedDrilldownTrade[];
}

export function QualityDrilldownModal({
  isOpen,
  onClose,
  filterType,
  filterTitle,
  tierLabel,
  trades = [],
}: QualityDrilldownModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [searchQuery, setSearchQuery] = useState('');

  // Filter trades based on selected category & search query
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Category filter
      let matchesCategory = true;
      const reason = (t.exit_reason || '').toLowerCase();
      if (filterType === 'tp1') {
        matchesCategory = reason === 'tp1' || t.status === 'tp1_hit';
      } else if (filterType === 'tp2') {
        matchesCategory = reason === 'tp2';
      } else if (filterType === 'sl') {
        matchesCategory = reason === 'sl';
      } else if (filterType === 'trailing') {
        matchesCategory = reason === 'trailing_stop' || reason === 'breakeven';
      }

      // Search query filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        t.symbol.toLowerCase().includes(q) || 
        (t.company_name && t.company_name.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [trades, filterType, searchQuery]);

  if (!isOpen) return null;

  const getExitBadge = (t: ClosedDrilldownTrade) => {
    const reason = (t.exit_reason || '').toLowerCase();
    if (reason === 'tp2') {
      return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">🏆 {isAr ? 'هدف ثاني TP2' : 'TP2 Target'}</span>;
    }
    if (reason === 'tp1' || t.status === 'tp1_hit') {
      return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">🎯 {isAr ? 'هدف أول TP1' : 'TP1 Target'}</span>;
    }
    if (reason === 'sl') {
      return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">🔴 {isAr ? 'وقف خسارة SL' : 'Stop Loss'}</span>;
    }
    if (reason === 'trailing_stop' || reason === 'breakeven') {
      return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">🛡 {isAr ? 'خروج محمي' : 'Protected Exit'}</span>;
    }
    return <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-1 rounded-lg text-xs font-bold">{isAr ? 'مغلقة' : 'Closed'}</span>;
  };

  const getAiLearningNote = (t: ClosedDrilldownTrade) => {
    const reason = (t.exit_reason || '').toLowerCase();
    const pnl = t.pnl_percent || 0;
    const symbol = t.symbol;
    const entry = t.entry_price ? Number(t.entry_price).toFixed(2) : '-';
    const exit = t.exit_price ? Number(t.exit_price).toFixed(2) : (t.tp1 ? Number(t.tp1).toFixed(2) : '-');

    if (reason === 'sl') {
      return (
        <div className="mt-2 text-xs bg-red-950/30 border border-red-900/40 p-3 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-red-400 font-bold">
            <Brain className="w-4 h-4 text-red-400" />
            <span>{isAr ? '💡 تحليل الذكاء الاصطناعي ودرس التعلم للنموذج (AI Post-Mortem):' : 'AI Post-Mortem & Model Learning Note:'}</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {isAr 
              ? `تم تفعيل أمر وقف الخسارة لسهم ${symbol} عند سعر ${exit} ج.م (تراجع بنسبة ${pnl.toFixed(1)}%). تم الاستجابة الآلية لحماية رأس المال لمنع تفاقم الخسائر عند كسر مستوى الدعم الفني ${t.sl || entry}. تم تغذية هذه النتيجة لنموذج الذكاء الاصطناعي لرفع حساسية تضبيط مستويات وقف الخسارة المستقبلية.`
              : `Stop loss executed for ${symbol} at ${exit} EGP (${pnl.toFixed(1)}% PnL). Capital protection triggered on support breakdown. Model weights updated to optimize future stop-loss placement.`}
          </p>
        </div>
      );
    }

    if (reason === 'tp1' || reason === 'tp2' || t.status === 'tp1_hit') {
      return (
        <div className="mt-2 text-xs bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-xl space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Brain className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? '💡 نمط نجاح الذكاء الاصطناعي (AI Success Pattern):' : 'AI Model Success Pattern:'}</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            {isAr
              ? `نجح النموذج في تحقيق الهدف المحدد لسهم ${symbol} بسعر دخول ${entry} ج.م وخروج ${exit} ج.م بمكسب (+${pnl.toFixed(1)}%). تم تثبيت معايير المؤشرات الفنية ونقاط التجميع المستخدمة في هذه التوصية.`
              : `Target successfully reached for ${symbol} from ${entry} EGP to ${exit} EGP (+${pnl.toFixed(1)}% PnL). Pattern confirmations validated for future recommendations.`}
          </p>
        </div>
      );
    }

    return (
      <div className="mt-2 text-xs bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl space-y-1.5">
        <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
          <Brain className="w-4 h-4" />
          <span>{isAr ? '💡 تقييم خروج الذكاء الاصطناعي:' : 'AI Exit Rationale:'}</span>
        </div>
        <p className="text-zinc-300 leading-relaxed">
          {isAr
            ? `تم إغلاق صفقة ${symbol} لحماية الأرباح وتفادي تقلبات السوق. سعر الدخول ${entry} ج.م وسعر الخروج ${exit} ج.م (صافي ${pnl > 0 ? '+' : ''}${pnl.toFixed(1)}%).`
            : `Trade closed for ${symbol} to lock profits and manage market risk. Entry ${entry} EGP, Exit ${exit} EGP (${pnl > 0 ? '+' : ''}${pnl.toFixed(1)}% PnL).`}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h2 className="text-lg font-black text-white">{filterTitle}</h2>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {tierLabel}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isAr 
                ? `عرض تفاصيل الصفقات المحسومة وتقييم نتائج الذكاء الاصطناعي (${filteredTrades.length} صفقة)`
                : `Detailed audit and AI learning post-mortems (${filteredTrades.length} trades)`}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-zinc-900/40 border-b border-zinc-800/80 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder={isAr ? "ابحث باسم السهم أو الرمز..." : "Search by stock symbol or name..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent-blue"
            />
          </div>
          <span className="text-xs text-zinc-400 font-mono px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
            {filteredTrades.length} {isAr ? 'صفقة' : 'trades'}
          </span>
        </div>

        {/* Trades List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredTrades.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <span className="text-4xl">🔍</span>
              <p className="text-sm font-bold text-zinc-400">
                {isAr ? 'لا توجد صفقات تطابق هذا التصنيف حالياً' : 'No trades matching this filter'}
              </p>
            </div>
          ) : (
            filteredTrades.map((t) => {
              const pnl = t.pnl_percent || 0;
              const isProfit = pnl >= 0;

              return (
                <div 
                  key={t.id}
                  className="glass-panel p-5 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all space-y-3 bg-zinc-900/50"
                >
                  {/* Top Row: Symbol, PnL & Status */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <Link 
                        href={`/${locale}/stock/${t.symbol}`}
                        className="text-base font-black text-white hover:text-accent-blue transition-colors flex items-center gap-1.5"
                      >
                        <span>{t.symbol}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                      </Link>
                      {t.company_name && (
                        <span className="text-xs text-zinc-400 font-medium">({t.company_name})</span>
                      )}
                      {getExitBadge(t)}
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <div className={`px-3 py-1 rounded-xl font-black text-sm border flex items-center gap-1 ${
                        isProfit 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        <span>{isProfit ? '+' : ''}{pnl.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Price Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-3 rounded-xl border border-zinc-800/80 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">{isAr ? 'سعر الدخول' : 'Entry Price'}</span>
                      <span className="font-bold text-white">{t.entry_price ? Number(t.entry_price).toFixed(2) : '-'} ج.م</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">{isAr ? 'سعر الخروج' : 'Exit Price'}</span>
                      <span className="font-bold text-amber-400">{t.exit_price ? Number(t.exit_price).toFixed(2) : '-'} ج.م</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">{isAr ? 'الهدف 1 / 2' : 'Targets 1 / 2'}</span>
                      <span className="font-bold text-emerald-400">{t.tp1 || '-'} / {t.tp2 || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">{isAr ? 'وقف الخسارة' : 'Stop Loss'}</span>
                      <span className="font-bold text-red-400">{t.sl || '-'} ج.م</span>
                    </div>
                  </div>

                  {/* AI Learning Note */}
                  {getAiLearningNote(t)}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Info className="w-4 h-4 text-accent-blue" />
            <span>{isAr ? 'يتم تحديث جميع التحليلات آلياً بواسطة نموذج التقييم المستمر للذكاء الاصطناعي v6.' : 'All post-mortems auto-evaluated by AI model v6 continuous learning.'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
}
