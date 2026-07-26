'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Target, 
  Search, 
  Filter, 
  Clock, 
  Zap, 
  ChevronRight,
  Layers
} from 'lucide-react';
import { useLocale } from 'next-intl';

export interface ActiveTrade {
  id: string;
  symbol: string;
  company_name?: string;
  sector?: string;
  trade_type: 'BUY' | 'SELL';
  entry_price: number;
  current_price: number;
  target_price_1: number;
  target_price_2: number;
  stop_loss: number;
  ml_probability?: number;
  timeframe: string;
  rationale_ar?: string;
  expected_target_date?: string;
  order_type?: 'MARKET' | 'LIMIT' | 'BREAKOUT_TRIGGER' | string;
  trigger_condition_ar?: string;
}

interface ActiveTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: ActiveTrade[];
}

export function ActiveTradesModal({ isOpen, onClose, trades }: ActiveTradesModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [dirFilter, setDirFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'MARKET' | 'LIMIT' | 'BREAKOUT_TRIGGER'>('ALL');

  // Extract unique sectors list
  const sectorsList = useMemo(() => {
    const sectors = new Set<string>();
    trades.forEach(t => {
      if (t.sector) sectors.add(t.sector);
    });
    return Array.from(sectors);
  }, [trades]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      // 1. Direction Filter
      const isBuy = (t.trade_type || 'BUY').toUpperCase() === 'BUY';
      if (dirFilter === 'BUY' && !isBuy) return false;
      if (dirFilter === 'SELL' && isBuy) return false;

      // 2. Order Type Filter
      if (orderTypeFilter !== 'ALL') {
        const type = t.order_type || 'MARKET';
        if (type !== orderTypeFilter) return false;
      }

      // 3. Sector Filter
      if (selectedSector !== 'ALL' && t.sector !== selectedSector) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const sym = (t.symbol || '').toLowerCase();
        const name = (t.company_name || '').toLowerCase();
        const sec = (t.sector || '').toLowerCase();
        if (!sym.includes(q) && !name.includes(q) && !sec.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [trades, dirFilter, orderTypeFilter, selectedSector, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in font-sans">
      <div className="glass-card w-full max-w-5xl max-h-[90vh] rounded-3xl p-5 sm:p-8 flex flex-col gap-6 overflow-hidden border border-white/10 shadow-2xl bg-surface-dark/95">
        
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-accent-blue/15 border border-accent-blue/30 text-accent-blue shadow-lg shadow-accent-blue/10">
              <Target className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>{isAr ? 'الصفقات التفاعلية المفتوحة بالمنصة' : 'Active Live Platform Signals'}</span>
                <span className="text-xs font-mono font-bold bg-accent-blue/20 text-accent-blue border border-accent-blue/30 px-2.5 py-0.5 rounded-full">
                  {filteredTrades.length} / {trades.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isAr ? 'متابعة لحظية لسعر السهم الحالي ومساره المباشر نحو الأهداف أو وقف الخسارة' : 'Real-time tracking of entry price, targets, and live position progress'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer self-end sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
          
          {/* Direction Filter Tabs */}
          <div className="sm:col-span-4 flex p-1 bg-black/40 border border-white/10 rounded-xl">
            <button
              onClick={() => setDirFilter('ALL')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dirFilter === 'ALL' ? 'bg-white/15 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {isAr ? 'الكل' : 'All'} ({trades.length})
            </button>
            <button
              onClick={() => setDirFilter('BUY')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                dirFilter === 'BUY' ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 shadow' : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isAr ? 'شراء' : 'BUY'}</span>
            </button>
            <button
              onClick={() => setDirFilter('SELL')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                dirFilter === 'SELL' ? 'bg-rose-500/25 text-rose-400 border border-rose-500/30 shadow' : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{isAr ? 'بيع' : 'SELL'}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'ابحث بالرمز أو اسم الشركة...' : 'Search symbol or company name...'}
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent-blue transition-colors font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sector Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full py-2 px-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-accent-blue transition-colors cursor-pointer font-sans"
            >
              <option value="ALL">{isAr ? 'جميع القطاعات' : 'All Sectors'}</option>
              {sectorsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Order Type Section Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/30 border border-white/10 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setOrderTypeFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
              orderTypeFilter === 'ALL'
                ? 'bg-accent-blue text-black shadow-lg shadow-accent-blue/20 font-black'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {isAr ? '✨ كافة التوصيات' : 'All Orders'}
          </button>
          <button
            onClick={() => setOrderTypeFilter('MARKET')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              orderTypeFilter === 'MARKET'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black'
                : 'text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <span>🟢 {isAr ? 'صفقات مباشرة بسعر السوق' : 'Live Market Orders'}</span>
          </button>
          <button
            onClick={() => setOrderTypeFilter('LIMIT')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              orderTypeFilter === 'LIMIT'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black'
                : 'text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <span>⏳ {isAr ? 'أوامر معلقة (Limit Buy)' : 'Pending Limit Orders'}</span>
          </button>
          <button
            onClick={() => setOrderTypeFilter('BREAKOUT_TRIGGER')}
            className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              orderTypeFilter === 'BREAKOUT_TRIGGER'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20 font-black'
                : 'text-purple-400/80 hover:text-purple-400 hover:bg-purple-500/10'
            }`}
          >
            <span>🎯 {isAr ? 'دخول مشروط باختراق شمعة' : 'Conditional Breakout Orders'}</span>
          </button>
        </div>

        {/* Risk Management & Execution Strategy Guide Banner */}
        <div className="bg-gradient-to-r from-accent-blue/15 via-purple-500/10 to-accent-gold/15 p-3.5 rounded-2xl border border-accent-blue/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-accent-gold shrink-0" />
            <div>
              <span className="font-extrabold text-white block">
                {isAr ? '🛡️ إستراتيجية التنفيذ المؤمّنة (قاعدة 50 / 50):' : '🛡️ Secured Execution Strategy (50/50 Rule):'}
              </span>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                {isAr 
                  ? 'عند وصول السهم للهدف الأول (TP1): بيع 50% من محفظتك وتأمين الـ 50% المتبقية برفع الاستوب تلقائياً إلى سعر الدخول (Breakeven). وعند الوصول للهدف الثاني (TP2): بيع الـ 50% المتبقية لحصد الأرباح الكاملة.'
                  : 'At TP1: Sell 50% and move Stop-Loss to Entry Price. At TP2: Sell remaining 50% to secure maximum gain.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content / Trades List */}
        <div className="overflow-y-auto space-y-4 pr-1.5 scrollbar-thin scrollbar-thumb-white/10">
          {filteredTrades.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 flex flex-col items-center gap-3">
              <Clock className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold">
                {isAr ? 'لا توجد صفقات تطابق خيارات الفلترة المحددة.' : 'No active trades match the selected filters.'}
              </p>
              {(searchQuery || dirFilter !== 'ALL' || selectedSector !== 'ALL') && (
                <button
                  onClick={() => { setDirFilter('ALL'); setSearchQuery(''); setSelectedSector('ALL'); }}
                  className="px-4 py-2 text-xs bg-white/5 border border-white/10 rounded-xl text-accent-blue hover:bg-white/10 transition cursor-pointer font-bold"
                >
                  {isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                </button>
              )}
            </div>
          ) : (
            filteredTrades.map((t) => {
              const isBuy = (t.trade_type || 'BUY').toUpperCase() === 'BUY';
              const entry = Number(t.entry_price || 0);
              const current = Number(t.current_price || entry);
              const tp1 = Number(t.target_price_1 || entry * 1.05);
              const tp2 = Number(t.target_price_2 || entry * 1.10);
              const sl = Number(t.stop_loss || entry * 0.95);

              // Calculate PnL %
              const pnlPct = isBuy
                ? ((current - entry) / entry) * 100
                : ((entry - current) / entry) * 100;
              const isPositive = pnlPct >= 0;

              // Calculate position pointer on scale [SL (0%) -> Entry (40%) -> TP1 (70%) -> TP2 (100%)]
              let pointerPos = 40; // Entry is at 40%
              if (isBuy) {
                if (current >= entry) {
                  const profitDist = tp2 - entry;
                  const currentGain = current - entry;
                  pointerPos = profitDist > 0 
                    ? 40 + Math.min(60, (currentGain / profitDist) * 60)
                    : 40;
                } else {
                  const lossDist = entry - sl;
                  const currentLoss = entry - current;
                  pointerPos = lossDist > 0
                    ? 40 - Math.min(38, (currentLoss / lossDist) * 38)
                    : 40;
                }
              } else {
                if (current <= entry) {
                  const profitDist = entry - tp2;
                  const currentGain = entry - current;
                  pointerPos = profitDist > 0
                    ? 40 + Math.min(60, (currentGain / profitDist) * 60)
                    : 40;
                } else {
                  const lossDist = sl - entry;
                  const currentLoss = current - entry;
                  pointerPos = lossDist > 0
                    ? 40 - Math.min(38, (currentLoss / lossDist) * 38)
                    : 40;
                }
              }

              // Remaining distance to TP1 / SL
              const distToTP1 = isBuy ? ((tp1 - current) / current) * 100 : ((current - tp1) / current) * 100;
              const distToSL = isBuy ? ((current - sl) / current) * 100 : ((sl - current) / current) * 100;

              return (
                <div
                  key={t.id || t.symbol}
                  className="p-5 rounded-2xl bg-white/[0.015] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-4 relative group"
                >
                  {/* Top Bar: Symbol, Name, Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-lg text-accent-blue bg-accent-blue/15 border border-accent-blue/30 px-3.5 py-1 rounded-xl">
                        {t.symbol}
                      </span>
                      <div>
                        {t.company_name && (
                          <span className="font-bold text-sm text-white block">{t.company_name}</span>
                        )}
                        {t.sector && (
                          <span className="text-[11px] text-zinc-400 block font-medium">{t.sector}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Order Type Badge */}
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border shadow-sm ${
                          t.order_type === 'LIMIT'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : t.order_type === 'BREAKOUT_TRIGGER'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : isBuy
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {t.order_type === 'LIMIT' ? (
                          <span>⏳ {isAr ? 'أمر معلق (Limit)' : 'Limit Order'}</span>
                        ) : t.order_type === 'BREAKOUT_TRIGGER' ? (
                          <span>🎯 {isAr ? 'دخول مشروط باختراق' : 'Breakout Trigger'}</span>
                        ) : isBuy ? (
                          <span>🟢 {isAr ? 'شراء مباشر' : 'Market BUY'}</span>
                        ) : (
                          <span>🔴 {isAr ? 'بيع مباشر' : 'Market SELL'}</span>
                        )}
                      </span>

                      {t.ml_probability && (
                        <span className="text-xs font-mono font-bold text-accent-gold bg-accent-gold/10 px-2.5 py-1.5 rounded-xl border border-accent-gold/20 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5" />
                          <span>{Math.round(t.ml_probability * 100)}% {isAr ? 'ثقة' : 'Conf'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4 Metric Cards Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-400 font-sans">{isAr ? 'سعر الدخول' : 'Entry Price'}</span>
                      <span className="font-bold text-white text-sm">{entry.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-400 font-sans">{isAr ? 'السعر الحالي (لايف)' : 'Current Price'}</span>
                      <span className={`font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {current.toFixed(2)} ج.م ({isPositive ? '+' : ''}{pnlPct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-400 font-sans">{isAr ? 'الهدف الأول (TP1)' : 'Target 1'}</span>
                      <span className="font-bold text-emerald-400 text-sm">{tp1.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-zinc-400 font-sans">{isAr ? 'وقف الخسارة (SL)' : 'Stop Loss'}</span>
                      <span className="font-bold text-rose-400 text-sm">{sl.toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  {/* Dynamic 5-Point Interactive Progress Gauge */}
                  <div className="flex flex-col gap-2 pt-1 font-sans">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <span>🎯 {isAr ? 'مسار الصفقة المباشر:' : 'Live Trade Journey:'}</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400">
                          {distToTP1 > 0 
                            ? (isAr ? `باقي +${distToTP1.toFixed(1)}% للهدف الأول` : `+${distToTP1.toFixed(1)}% to TP1`)
                            : (isAr ? '✓ تم إنجاز الهدف الأول 🎉' : '✓ TP1 Reached! 🎉')
                          }
                        </span>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="relative w-full h-4 bg-black/60 rounded-full border border-white/10 overflow-hidden my-3">
                      {/* Entry Line Indicator */}
                      <div className="absolute left-[40%] top-0 bottom-0 w-[2px] bg-white/50 z-10" />

                      {/* Green / Red Filled Bar */}
                      {pointerPos >= 40 ? (
                        <div
                          className="absolute left-[40%] top-0 bottom-0 bg-gradient-to-r from-emerald-500/40 to-emerald-400 transition-all duration-700 rounded-r"
                          style={{ width: `${pointerPos - 40}%` }}
                        />
                      ) : (
                        <div
                          className="absolute top-0 bottom-0 bg-gradient-to-l from-rose-500/40 to-rose-500 transition-all duration-700 rounded-l"
                          style={{ left: `${pointerPos}%`, width: `${40 - pointerPos}%` }}
                        />
                      )}

                      {/* Live Pointer Pin */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-700 flex flex-col items-center"
                        style={{ left: `${pointerPos}%` }}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg animate-pulse ${isPositive ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
                      </div>
                    </div>

                    {/* Labels below scale */}
                    <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 -mt-1 px-1">
                      <span className="text-rose-400 font-bold">🛑 SL: {sl.toFixed(2)}</span>
                      <span className="text-white font-bold">📍 دخول: {entry.toFixed(2)}</span>
                      <span className="text-emerald-400 font-bold">🎯 TP1: {tp1.toFixed(2)}</span>
                      <span className="text-cyan-400 font-bold">🚀 TP2: {tp2.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Rationale description & Expected Target Date */}
                  <div className="flex flex-col gap-2 font-sans mt-1">
                    {t.trigger_condition_ar && (
                      <div className="text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 leading-relaxed font-medium">
                        ⚙️ <span className="font-bold text-amber-200">{isAr ? 'شرط تفعيل الدخول:' : 'Trigger Condition:'}</span> {t.trigger_condition_ar}
                      </div>
                    )}
                    {t.rationale_ar && (
                      <div className="text-xs text-zinc-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 leading-relaxed">
                        💡 <span className="font-semibold text-white">{isAr ? 'سبب التوصية والتحليل:' : 'Rationale:'}</span> {t.rationale_ar}
                      </div>
                    )}
                    {t.expected_target_date && (
                      <div className="text-xs text-accent-gold bg-accent-gold/10 p-2 rounded-xl border border-accent-gold/20 flex items-center justify-between font-mono font-medium">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تاريخ الهدف المتوقع (توقع الذكاء الاصطناعي):' : 'AI Expected Target Date:'}</span>
                        </span>
                        <span className="font-bold text-white">{t.expected_target_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
