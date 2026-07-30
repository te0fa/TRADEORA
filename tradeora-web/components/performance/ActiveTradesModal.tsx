'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  X, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  RotateCcw,
  AlertTriangle
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
  is_top_pick?: boolean;
  is_shariah_compliant?: boolean;
  scalp_indicators?: {
    volume_surge_ar?: string;
    volatility_ar?: string;
    momentum_velocity_ar?: string;
    news_catalyst_ar?: string;
    is_confirmed_scalp?: boolean;
  };
}

interface ActiveTradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: ActiveTrade[];
  sellSignals?: ActiveTrade[];
}

export function ActiveTradesModal({ isOpen, onClose, trades, sellSignals = [] }: ActiveTradesModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [signalMode, setSignalMode] = useState<'BUY' | 'SELL'>('BUY');
  const [viewScope, setViewScope] = useState<'TOP_PICKS' | 'ALL_MARKET'>('TOP_PICKS');
  const [shariahOnly, setShariahOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'MARKET' | 'LIMIT' | 'BREAKOUT_TRIGGER'>('ALL');
  const [strategyFilter, setStrategyFilter] = useState<'ALL' | 'DAY_TRADING' | 'SWING_POSITION'>('ALL');

  // Base list depending on signal mode tab
  const baseTradesList = useMemo(() => {
    return signalMode === 'BUY' ? trades : sellSignals;
  }, [signalMode, trades, sellSignals]);

  // Active Scoped Trades (Top 15 vs Full Market Trades for BUY signals)
  const scopedTrades = useMemo(() => {
    if (signalMode === 'BUY' && viewScope === 'TOP_PICKS') {
      return baseTradesList.filter((t, idx) => (t.is_top_pick !== undefined ? t.is_top_pick : idx < 15));
    }
    return baseTradesList;
  }, [baseTradesList, signalMode, viewScope]);

  // Extract unique sectors list from scoped trades
  const sectorsList = useMemo(() => {
    const sectors = new Set<string>();
    scopedTrades.forEach(t => {
      if (t.sector) sectors.add(t.sector);
    });
    return Array.from(sectors);
  }, [scopedTrades]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSector('ALL');
    setOrderTypeFilter('ALL');
    setStrategyFilter('ALL');
    setShariahOnly(false);
  };

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return scopedTrades.filter((t) => {
      // 0. Shariah Compliance Filter
      if (shariahOnly && !t.is_shariah_compliant) return false;

      // 1. Order Type Filter
      if (orderTypeFilter !== 'ALL') {
        const type = t.order_type || 'MARKET';
        if (type !== orderTypeFilter) return false;
      }

      // 2. Strategy Horizon Filter (Day Trading 2-3% vs Swing/Position)
      const entry = Number(t.entry_price || 1);
      const tp1 = Number(t.target_price_1 || entry * 1.05);
      const tp1Gain = Math.abs((tp1 - entry) / entry) * 100;
      const isDayTrading = tp1Gain <= 4.5;

      if (strategyFilter === 'DAY_TRADING' && !isDayTrading) return false;
      if (strategyFilter === 'SWING_POSITION' && isDayTrading) return false;

      // 3. Sector Filter
      if (selectedSector !== 'ALL' && t.sector !== selectedSector) return false;

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const symMatches = t.symbol.toLowerCase().includes(q);
        const nameMatches = t.company_name?.toLowerCase().includes(q);
        const secMatches = t.sector?.toLowerCase().includes(q);
        if (!symMatches && !nameMatches && !secMatches) return false;
      }

      return true;
    });
  }, [scopedTrades, shariahOnly, orderTypeFilter, strategyFilter, selectedSector, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-sans">
      <div className="glass-card w-full max-w-6xl h-[94vh] rounded-3xl p-4 sm:p-6 flex flex-col gap-4 overflow-hidden border border-white/10 shadow-2xl bg-surface-dark/95">
        
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-accent-blue/15 border border-accent-blue/30 text-accent-blue shadow-lg shadow-accent-blue/10">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>{isAr ? 'الصفقات التفاعلية المفتوحة بالمنصة' : 'Active Live Platform Signals'}</span>
                <span className="text-xs font-mono font-bold bg-accent-blue/20 text-accent-blue border border-accent-blue/30 px-2.5 py-0.5 rounded-full">
                  {filteredTrades.length} / {scopedTrades.length}
                </span>
              </h2>
            </div>
          </div>

          {/* Dedicated Mode Tabs: BUY Signals vs SELL Warnings */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-black/50 border border-white/10 rounded-2xl">
              <button
                onClick={() => { setSignalMode('BUY'); setViewScope('TOP_PICKS'); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  signalMode === 'BUY'
                    ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 shadow-lg font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🟢 {isAr ? `فرص الشراء والتجميع (${trades.length})` : `BUY Signals (${trades.length})`}</span>
              </button>

              <button
                onClick={() => { setSignalMode('SELL'); setViewScope('ALL_MARKET'); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  signalMode === 'SELL'
                    ? 'bg-rose-500/25 text-rose-400 border border-rose-500/40 shadow-lg font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🔻 {isAr ? `تنبيهات البيع والتخفيف (${sellSignals.length})` : `SELL Warnings (${sellSignals.length})`}</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Premier Tier Scope Toggle Bar for BUY signals */}
        {signalMode === 'BUY' ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-2 bg-gradient-to-r from-amber-500/15 via-accent-blue/15 to-purple-500/15 border border-amber-500/30 rounded-2xl gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewScope('TOP_PICKS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                  viewScope === 'TOP_PICKS'
                    ? 'bg-amber-400 text-black shadow-lg font-black'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>👑 {isAr ? 'صفقات النخبة الذهبية (الأعلى ثقة ودقة)' : 'Premier Top Picks'}</span>
              </button>

              <button
                onClick={() => setViewScope('ALL_MARKET')}
                className={`px-3.5 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 font-bold ${
                  viewScope === 'ALL_MARKET'
                    ? 'bg-accent-blue text-white shadow-lg font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>🌐 {isAr ? `عرض كنز صفقات السوق الكامل (${trades.length} سهم)` : `Full Market Database (${trades.length})`}</span>
              </button>
            </div>

            <span className="text-[11px] text-amber-200/90 font-medium px-2">
              {viewScope === 'TOP_PICKS' 
                ? (isAr ? '✨ يعرض حالياً أقوى 15 صفقة شراء مختارة بدقة' : 'Showing top 15 premier buy picks')
                : (isAr ? '🌐 يعرض كافة فرص الشراء المتاحة بالسوق' : 'Showing full market buy database')}
            </span>
          </div>
        ) : (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs text-rose-200 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {isAr 
                ? '🔻 قسم تنبيهات البيع وتخفيف المراكز: خاص بملكي الأسهم لتجنيب الأرباح وحماية المحفظة. لا تدرج هذه التنبيهات ضمن تقييم أداء المنصة.'
                : 'SELL Warnings Tab: Risk management signals for stock holders. Excluded from platform win rate.'}
            </span>
          </div>
        )}

        {/* Ultra-Compact Controls Toolbar */}
        <div className="flex flex-col gap-2 bg-white/[0.02] p-2.5 rounded-2xl border border-white/5 shrink-0 text-xs">
          
          {/* Row 1: Search, Sector, Shariah Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[180px] relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'ابحث بالرمز أو اسم الشركة...' : 'Search symbol...'}
                className="w-full pl-8 pr-2.5 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-accent-blue font-sans"
              />
            </div>

            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="py-1.5 px-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none cursor-pointer font-sans"
            >
              <option value="ALL">{isAr ? 'جميع القطاعات' : 'All Sectors'}</option>
              {sectorsList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => setShariahOnly(!shariahOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                shariahOnly
                  ? 'bg-emerald-500/25 text-emerald-400 border-emerald-500/40 font-black shadow'
                  : 'bg-white/5 text-zinc-300 border-white/10 hover:border-emerald-500/30'
              }`}
            >
              <span>🕌 {isAr ? 'أسهم الشريعة فقط (EGX33)' : 'Shariah Only'}</span>
            </button>
          </div>

          {/* Row 2: Order Types & Strategy Horizon */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
            {/* Order Types */}
            <div className="flex p-0.5 bg-black/40 border border-white/10 rounded-xl">
              <button
                onClick={() => setOrderTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  orderTypeFilter === 'ALL' ? 'bg-accent-blue/30 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'جميع الأوامر' : 'All Types'}
              </button>
              <button
                onClick={() => setOrderTypeFilter('MARKET')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  orderTypeFilter === 'MARKET' ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 shadow' : 'text-zinc-400 hover:text-emerald-400'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{isAr ? 'تنفيذ بسعر السوق' : 'Market'}</span>
              </button>
              <button
                onClick={() => setOrderTypeFilter('LIMIT')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  orderTypeFilter === 'LIMIT' ? 'bg-amber-500/25 text-amber-400 border border-amber-500/30 shadow' : 'text-zinc-400 hover:text-amber-400'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>{isAr ? 'أوامر معلقة (Limit)' : 'Limit'}</span>
              </button>
              <button
                onClick={() => setOrderTypeFilter('BREAKOUT_TRIGGER')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  orderTypeFilter === 'BREAKOUT_TRIGGER' ? 'bg-purple-500/25 text-purple-400 border border-purple-500/30 shadow' : 'text-zinc-400 hover:text-purple-400'
                }`}
              >
                <Target className="w-3 h-3" />
                <span>{isAr ? 'دخول مشروط باختراق' : 'Breakout'}</span>
              </button>
            </div>

            {/* Strategy Horizon */}
            <div className="flex p-0.5 bg-black/40 border border-white/10 rounded-xl">
              <button
                onClick={() => setStrategyFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  strategyFilter === 'ALL' ? 'bg-white/15 text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isAr ? 'كافة الأفاق' : 'All Horizons'}
              </button>
              <button
                onClick={() => setStrategyFilter('DAY_TRADING')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  strategyFilter === 'DAY_TRADING' ? 'bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 shadow' : 'text-zinc-400 hover:text-cyan-400'
                }`}
              >
                ⚡ {isAr ? 'مضاربة سريعة (2-3%)' : 'Scalp'}
              </button>
              <button
                onClick={() => setStrategyFilter('SWING_POSITION')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  strategyFilter === 'SWING_POSITION' ? 'bg-purple-500/25 text-purple-400 border border-purple-500/30 shadow' : 'text-zinc-400 hover:text-purple-400'
                }`}
              >
                🎯 {isAr ? 'سوينغ واستثمار' : 'Swing'}
              </button>
            </div>
          </div>
        </div>

        {/* Spacious Stock Cards Scrollable Container */}
        <div className="flex-1 overflow-y-auto min-h-[460px] pr-1 space-y-4 font-sans">
          {filteredTrades.length === 0 ? (
            <div className="w-full py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="p-4 rounded-full bg-white/5 border border-white/10 text-zinc-500">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold text-white">
                  {isAr ? 'لا توجد صفقات تطابق خيارات الفلترة المحددة' : 'No matching trades found'}
                </p>
                <p className="text-xs text-zinc-400 max-w-sm">
                  {isAr ? 'جرب تغيير أو إزالة بعض الفلاتر لعرض الصفقات المتاحة بالسوق.' : 'Try clearing some filters to view available signals.'}
                </p>
              </div>

              <button
                onClick={handleResetFilters}
                className="mt-2 px-5 py-2.5 rounded-xl bg-accent-blue/20 text-accent-blue border border-accent-blue/40 hover:bg-accent-blue/30 font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset All Filters'}</span>
              </button>
            </div>
          ) : (
            filteredTrades.map((t) => {
              const isBuy = (t.trade_type || 'BUY').toUpperCase() === 'BUY';
              const entry = Number(t.entry_price || 0);
              const current = Number(t.current_price || entry);
              const tp1 = Number(t.target_price_1 || entry * (isBuy ? 1.05 : 0.95));
              const tp2 = Number(t.target_price_2 || entry * (isBuy ? 1.10 : 0.90));
              const sl = Number(t.stop_loss || entry * (isBuy ? 0.95 : 1.05));
              const orderType = t.order_type || 'MARKET';

              // Order Type Execution Status Logic:
              const isLimitPending = orderType === 'LIMIT' && (isBuy ? current > entry : current < entry);
              const isLimitFilled = orderType === 'LIMIT' && (isBuy ? current <= entry : current >= entry);

              const isBreakoutPending = orderType === 'BREAKOUT_TRIGGER' && (isBuy ? current < entry : current > entry);
              const isBreakoutTriggered = orderType === 'BREAKOUT_TRIGGER' && (isBuy ? current >= entry : current <= entry);

              const isPendingExecution = isLimitPending || isBreakoutPending;

              // Calculate PnL %
              const pnlPct = isBuy
                ? ((current - entry) / entry) * 100
                : ((entry - current) / entry) * 100;
              const isPositive = pnlPct >= 0;
              const isZeroChange = Math.abs(pnlPct) < 0.05;

              // Progress Scale & Pointer Position Math
              let pointerPos = 0;
              if (isLimitPending) {
                // Distance remaining to drop down to limit entry
                pointerPos = Math.max(5, Math.min(95, 100 - distToEntry * 12));
              } else if (isBreakoutPending) {
                // Distance remaining to rise up to breakout entry
                pointerPos = Math.max(5, Math.min(95, 100 - distToEntry * 12));
              } else if (isBuy) {
                if (isZeroChange) {
                  pointerPos = 0; // Starts clean at 0% when price hasn't moved!
                } else if (current > entry) {
                  const gainDist = Math.max(0.01, tp1 - entry);
                  pointerPos = Math.min(100, ((current - entry) / gainDist) * 100);
                } else {
                  const lossDist = Math.max(0.01, entry - sl);
                  pointerPos = Math.min(100, ((entry - current) / lossDist) * 100);
                }
              } else {
                // SELL / Short direction
                if (isZeroChange) {
                  pointerPos = 0;
                } else if (current < entry) {
                  const gainDist = Math.max(0.01, entry - tp1);
                  pointerPos = Math.min(100, ((entry - current) / gainDist) * 100);
                } else {
                  const lossDist = Math.max(0.01, sl - entry);
                  pointerPos = Math.min(100, ((current - entry) / lossDist) * 100);
                }
              }

              // Remaining distance calculations
              const distToTP1 = isBuy ? ((tp1 - current) / current) * 100 : ((current - tp1) / current) * 100;
              const distToEntry = Math.abs((current - entry) / current) * 100;

              return (
                <div
                  key={t.id || t.symbol}
                  className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-4 relative group"
                >
                  {/* Top Bar: Symbol, Name, Badges & Shariah Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-black text-lg px-3.5 py-1 rounded-xl border ${
                        isBuy
                          ? 'text-accent-blue bg-accent-blue/15 border-accent-blue/30'
                          : 'text-rose-400 bg-rose-500/15 border-rose-500/30'
                      }`}>
                        {t.symbol}
                      </span>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-white group-hover:text-accent-blue transition-colors">
                            {t.company_name || t.symbol}
                          </h3>
                          
                          {/* Prominent Shariah Badge */}
                          {t.is_shariah_compliant && (
                            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1 shadow-sm">
                              🕌 {isAr ? 'أسهم الشريعة (EGX33)' : 'Shariah EGX33'}
                            </span>
                          )}
                        </div>

                        {t.sector && (
                          <span className="text-xs text-zinc-400 block mt-0.5">
                            {t.sector}
                          </span>
                        )}

                        {/* Rich Scalp Support Indicators Badges - ONLY for true confirmed Scalp trades */}
                        {t.scalp_indicators && t.scalp_indicators.is_confirmed_scalp && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {t.scalp_indicators.volume_surge_ar && (
                              <span className="text-[10px] font-extrabold text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                                {t.scalp_indicators.volume_surge_ar}
                              </span>
                            )}
                            {t.scalp_indicators.volatility_ar && (
                              <span className="text-[10px] font-extrabold text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-md border border-cyan-500/30">
                                {t.scalp_indicators.volatility_ar}
                              </span>
                            )}
                            {t.scalp_indicators.momentum_velocity_ar && (
                              <span className="text-[10px] font-extrabold text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                                {t.scalp_indicators.momentum_velocity_ar}
                              </span>
                            )}
                            {t.scalp_indicators.news_catalyst_ar && (
                              <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                {t.scalp_indicators.news_catalyst_ar}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Execution Status Badge */}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                        isLimitPending
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                          : isLimitFilled
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isBreakoutPending
                          ? 'bg-purple-500/15 text-purple-400 border-purple-500/30 animate-pulse'
                          : isBreakoutTriggered
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : isBuy
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}>
                        {isLimitPending ? (
                          <>⏳ {isAr ? `أمر حد معلق عند ${entry.toFixed(2)} ج.م (بانتظار الهبوط)` : `Pending Limit ${entry.toFixed(2)} EGP`}</>
                        ) : isLimitFilled ? (
                          <>✅ {isAr ? `تم التنفيذ بسعر الحد (${entry.toFixed(2)} ج.م)` : 'Limit Order Filled'}</>
                        ) : isBreakoutPending ? (
                          <>🎯 {isAr ? `دخول مشروط باختراق ${entry.toFixed(2)} ج.م` : `Pending Breakout ${entry.toFixed(2)} EGP`}</>
                        ) : isBreakoutTriggered ? (
                          <>✅ {isAr ? `تم الاختراق والتأكيد عند ${entry.toFixed(2)} ج.م` : 'Breakout Triggered'}</>
                        ) : isBuy ? (
                          <>⚡ {isAr ? 'شراء فوري بسعر السوق الحالي' : 'Market BUY Active'}</>
                        ) : (
                          <>🔻 {isAr ? 'بيع وتخفيف مراكز بسعر السوق' : 'Market SELL Active'}</>
                        )}
                      </span>

                      {/* Confidence Score Badge */}
                      {t.ml_probability && (
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1">
                          ⚡ {Math.round(t.ml_probability * 100)}% {isAr ? 'ثقة' : 'Conf'}
                        </span>
                      )}

                      <Link
                        href={`/${locale}/stock/${t.symbol}`}
                        className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Trigger / Execution Condition Banner if pending */}
                  {isPendingExecution && (
                    <div className="text-xs text-amber-200 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 font-medium">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          {isLimitPending
                            ? (isAr ? `أمر حد معلق: السعر الحالي (${current.toFixed(2)} ج.م)، ينتظر الهبوط لشراء الحد عند (${entry.toFixed(2)} ج.م).` : `Pending Limit: Waiting for price to drop to ${entry.toFixed(2)} EGP.`)
                            : (isAr ? `دخول مشروط: السعر الحالي (${current.toFixed(2)} ج.م)، ينشط التفعيل فور اختراق المقاومة (${entry.toFixed(2)} ج.م).` : `Pending Breakout: Triggers upon breaking ${entry.toFixed(2)} EGP.`)}
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                        {isAr ? `باقي ${distToEntry.toFixed(1)}% لسعر التنفيذ` : `${distToEntry.toFixed(1)}% to entry`}
                      </span>
                    </div>
                  )}

                  {/* Live Prices Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 block text-[11px]">{isBuy ? (isAr ? 'نقطة الشراء المستهدفة' : 'Target Entry Price') : (isAr ? 'نقطة البيع المستهدفة' : 'Target Exit Entry')}</span>
                      <span className="font-bold text-white text-sm">{entry.toFixed(2)} ج.م</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[11px]">{isAr ? 'السعر الحالي (لايف)' : 'Current Price'}</span>
                      <span className="font-bold text-cyan-400 text-sm flex items-center gap-1">
                        {current.toFixed(2)} ج.م
                        <span className={`text-[10px] ${isZeroChange ? 'text-zinc-400' : isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ({isPositive ? '+' : ''}{pnlPct.toFixed(1)}%)
                        </span>
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[11px]">{isBuy ? (isAr ? 'الهدف الأول (TP1)' : 'Target 1') : (isAr ? 'مستهدف الهبوط (TP1)' : 'Downside TP1')}</span>
                      <span className={`font-bold text-sm ${isBuy ? 'text-emerald-400' : 'text-rose-400'}`}>{tp1.toFixed(2)} ج.م</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block text-[11px]">{isBuy ? (isAr ? 'وقف الخسارة (SL)' : 'Stop Loss') : (isAr ? 'وقف خروج حرج (SL)' : 'Stop Exit')}</span>
                      <span className={`font-bold text-sm ${isBuy ? 'text-rose-400' : 'text-amber-400'}`}>{sl.toFixed(2)} ج.م</span>
                    </div>
                  </div>

                  {/* Visual Progress Scale Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>
                        {isLimitPending 
                          ? (isAr ? `مسار الهبوط لشراء الحد عند ${entry.toFixed(2)} ج.م:` : 'Pullback Progress to Entry:')
                          : isBreakoutPending
                          ? (isAr ? `مسار الصعود لاختراق المقاومة عند ${entry.toFixed(2)} ج.م:` : 'Breakout Progress to Entry:')
                          : (isAr ? 'مسار الصفقة نحو الهدف / الوقف:' : 'Live Trade Progress:')}
                      </span>

                      <span className={isPendingExecution ? 'text-amber-400 font-bold' : isZeroChange ? 'text-zinc-400 font-medium' : isPositive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isLimitPending 
                          ? (isAr ? `باقي ${distToEntry.toFixed(1)}% للهبوط والتنفيذ عند ${entry.toFixed(2)} ج.م` : `${distToEntry.toFixed(1)}% to entry`)
                          : isBreakoutPending
                          ? (isAr ? `باقي ${distToEntry.toFixed(1)}% للاختراق والتنفيذ عند ${entry.toFixed(2)} ج.م` : `${distToEntry.toFixed(1)}% to trigger`)
                          : isZeroChange
                          ? (isAr ? 'لم يتغير السعر بعد (بانتظار الحركة)' : 'Price unchanged (0.0%)')
                          : distToTP1 <= 0 
                          ? (isAr ? '🎉 تم تحقيق الهدف الأول!' : 'TP1 Hit!') 
                          : isPositive
                          ? `${isAr ? 'ربح' : 'Gain'} +${pnlPct.toFixed(1)}% (باقي ${distToTP1.toFixed(1)}% للهدف)`
                          : `${isAr ? 'تراجع' : 'Loss'} ${pnlPct.toFixed(1)}% (الوقف عند ${sl.toFixed(2)} ج.م)`}
                      </span>
                    </div>

                    <div className="relative w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          isLimitPending
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : isBreakoutPending
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-400'
                            : isZeroChange
                            ? 'bg-zinc-600'
                            : isPositive 
                            ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400' 
                            : 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, pointerPos))}%` }}
                      />
                    </div>
                  </div>

                  {/* Institutional Cancellation Safeguard Notice for Pending Orders */}
                  {isPendingExecution && (
                    <div className="text-[11px] text-zinc-400 bg-white/[0.015] p-2.5 rounded-xl border border-white/5 leading-relaxed">
                      🛡️ <span className="font-bold text-amber-400">{isAr ? 'قانون النزاهة الدستوري:' : 'Institutional Rule:'}</span>{' '}
                      {isAr 
                        ? `إذا ارتفع السهم للهدف دون الهبوط أولاً والتنفيذ عند سعر الشراء المحدد (${entry.toFixed(2)} ج.م)، تُعتبر التوصية (ملغاة لعدم التنفيذ) ولا تدرج ضمن نسبة نجاح المنصة.`
                        : `If stock jumps to TP1 without touching limit entry (${entry.toFixed(2)} EGP), order is cancelled as un-filled and excluded from win-rate.`}
                    </div>
                  )}

                  {/* AI Rationale Explanation */}
                  {t.rationale_ar && (
                    <p className="text-xs text-zinc-300 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      💡 <span className="font-semibold text-accent-blue">{isAr ? 'الرؤية والتحليل:' : 'Rationale:'}</span> {t.rationale_ar}
                    </p>
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
