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

      // 2. Sector Filter
      if (selectedSector !== 'ALL' && t.sector !== selectedSector) return false;

      // 3. Search Query
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
  }, [trades, dirFilter, selectedSector, searchQuery]);

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

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 border shadow-sm ${
                          isBuy
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {isBuy ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {isBuy ? (isAr ? '🟢 إشارة شراء' : '🟢 BUY') : (isAr ? '🔴 إشارة بيع' : '🔴 SELL')}
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

                  {/* Rationale description if present */}
                  {t.rationale_ar && (
                    <div className="text-xs text-zinc-300 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 leading-relaxed font-sans mt-1">
                      💡 <span className="font-semibold text-white">{isAr ? 'التحليل:' : 'Rationale:'}</span> {t.rationale_ar}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
