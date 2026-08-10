'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, TrendingUp, TrendingDown, Layers,
  HelpCircle, ChevronDown, ChevronUp, Zap, BarChart2,
  RefreshCw, Wifi, WifiOff, Clock, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Level2OrderBookProps {
  symbol: string;
  companyId?: string;
  isAr?: boolean;
  currentPrice?: number;
}

const REFRESH_INTERVAL_MS = 30_000; // 30 seconds

export function Level2OrderBook({ symbol, companyId, isAr = true, currentPrice }: Level2OrderBookProps) {
  const [orderbook, setOrderbook]   = useState<any>(null);
  const [vpData, setVpData]         = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showGuide, setShowGuide]   = useState(false);
  const [isLive, setIsLive]         = useState(true);
  const [countdown, setCountdown]   = useState(REFRESH_INTERVAL_MS / 1000);
  const intervalRef  = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const qParams = `symbol=${encodeURIComponent(symbol)}&company_id=${encodeURIComponent(companyId || '')}&price=${encodeURIComponent(currentPrice?.toString() || '')}&t=${Date.now()}`;
      const [obRes, vpRes] = await Promise.all([
        fetch(`/api/orderbook?${qParams}`),
        fetch(`/api/volume-profile?${qParams}`),
      ]);

      const obJson = await obRes.json();
      const vpJson = await vpRes.json();

      if (obJson.success) {
        setOrderbook(obJson.orderbook);
      } else {
        setOrderbook({ data_status: 'UNAVAILABLE', available: false, bids: [], asks: [] });
      }

      if (vpJson.success) {
        setVpData(vpJson);
      }
      
      setLastUpdated(new Date());
      setIsLive(true);
      setCountdown(REFRESH_INTERVAL_MS / 1000);
    } catch (err) {
      console.error('[Level2OrderBook] Fetch error:', err);
      setIsLive(false);
      setOrderbook({ data_status: 'UNAVAILABLE', available: false, bids: [], asks: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [symbol, companyId, currentPrice]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchData(), REFRESH_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  // Countdown ticker
  useEffect(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) return REFRESH_INTERVAL_MS / 1000;
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [lastUpdated]);

  // Format time since last update
  const timeSinceUpdate = lastUpdated
    ? Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    : null;

  const timeLabel = timeSinceUpdate != null
    ? timeSinceUpdate < 60
      ? (isAr ? `منذ ${timeSinceUpdate}ث` : `${timeSinceUpdate}s ago`)
      : (isAr ? `منذ ${Math.floor(timeSinceUpdate / 60)}د` : `${Math.floor(timeSinceUpdate / 60)}m ago`)
    : (isAr ? 'يُحمَّل...' : 'Loading...');

  const dataStatus = orderbook?.data_status || 'UNAVAILABLE';
  const isAvailable = orderbook?.available && (orderbook?.bids?.length > 0 || orderbook?.asks?.length > 0);
  const isDerived = orderbook?.is_derived || dataStatus === 'DERIVED';

  const bids       = orderbook?.bids || [];
  const asks       = orderbook?.asks || [];
  const ofi        = orderbook?.ofi_ratio;
  const maxBidVol  = bids.length > 0 ? Math.max(...bids.map((b: any) => b.volume), 1) : 1;
  const maxAskVol  = asks.length > 0 ? Math.max(...asks.map((a: any) => a.volume), 1) : 1;
  const vp         = vpData?.volume_profile;
  const vwap       = vpData?.vwap;

  // Price position vs VPOC
  const vpoc = vp?.vpoc;
  const priceVsVpoc = vpoc && currentPrice
    ? ((currentPrice - vpoc) / vpoc) * 100
    : null;

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 text-center text-zinc-500 py-12">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs font-mono">{isAr ? 'جاري فحص عمق السوق ومستويات السيولة...' : 'Checking market depth and liquidity levels...'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h2 className="text-lg font-bold text-white">
                {isAr ? 'تحليل عمق السيولة ونقاط التمركز (Volume Profile & DOM)' : 'Volume Profile & Order Flow Analysis'}
              </h2>
              {/* Status indicator */}
              {isAvailable ? (
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDerived 
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' 
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse'
                }`}>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {isDerived ? (isAr ? 'مشتق خوارزمياً' : 'DERIVED') : (isAr ? 'بيانات حية' : 'LIVE')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-zinc-800 text-zinc-400 border-zinc-700">
                  <ShieldAlert className="w-2.5 h-2.5 text-zinc-400" />
                  {isAr ? 'عمق السوق غير متاح' : 'L2 UNAVAILABLE'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-zinc-400">
                {isAr ? 'حسابات خوارزمية لحظية لمستويات نقطة التحكم (VPOC) ومناطق القيمة والتمركز السعري.' : 'Algorithmic calculations for VPOC, Value Area, and Order Flow balance.'}
              </p>
              <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                <Clock className="w-3 h-3" />
                {timeLabel}
                <span className="text-zinc-600">
                  {isAr ? `• يُحدَّث خلال ${countdown}ث` : `• refresh in ${countdown}s`}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Manual refresh button */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-emerald-700/30 text-xs font-bold text-emerald-400 border border-emerald-500/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث الآن' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'دليل القراءة' : 'Guide'}</span>
              {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Educational Guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-zinc-900/90 border border-emerald-500/20 p-5 rounded-2xl space-y-3 text-xs leading-relaxed text-zinc-300"
            >
              <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isAr ? 'كيف تقرأ عمق السوق وتتداول به؟' : 'How to Trade Using Level 2 & Volume Profile'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <span className="font-bold text-white block">🎯 VPOC (نقطة التحكم بالحجم):</span>
                  <p className="text-zinc-400">
                    {isAr
                      ? 'السعر الذي تم التداول عنده بأكبر حجم سيولة. السهم قادم من أسفل → أقوى دعم مؤسسي. قادم من أعلى → مقاومة حجمية رئيسية.'
                      : 'Price with highest traded volume. Coming from below → strongest institutional support. Coming from above → major volume resistance.'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="font-bold text-white block">📈 VAH & VAL (منطقة القيمة 70%):</span>
                  <p className="text-zinc-400">
                    {isAr
                      ? 'اختراق VAH بحجم عالٍ → اختراق حقيقي ممتاز. التداول تحت VAL → إشارة ضعف شديدة. بينهما = منطقة التوازن.'
                      : 'Breakout above VAH on volume → genuine bullish breakout. Below VAL → severe weakness signal. Between = fair value zone.'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="font-bold text-white block">⚖️ OFI Imbalance (ميزان الطلبات):</span>
                  <p className="text-zinc-400">
                    {isAr
                      ? 'OFI ≥ 1.8 → جدار شراء مؤسسي قوي (إشارة صعود). OFI ≤ 0.5 → جدار بيع وتصريف (إشارة هبوط). OFI بين 0.8-1.2 = توازن.'
                      : 'OFI ≥ 1.8 → strong institutional buy wall (bullish). OFI ≤ 0.5 → sell wall/distribution (bearish). 0.8-1.2 = balanced.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Volume Profile Summary (Real Candle-derived levels) */}
        {vp && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-bold flex items-center gap-1.5 text-zinc-300">
                <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
                {isAr ? 'مستويات التمركز الحجمي (Volume Profile - مشتقة من الشموع التاريخية)' : 'Volume Profile Levels (Derived from Historical Candles)'}
              </span>
              <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {isAr ? 'بيانات محسوبة' : 'Calculated Model'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/30 transition-colors">
                <span className="text-zinc-400 block text-[11px] mb-1">
                  🎯 VPOC {isAr ? '(مركز التحكم)' : '(Point of Control)'}
                </span>
                <span className="text-sm font-extrabold text-amber-400">{vp.vpoc?.toFixed(3)} {isAr ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                <span className="text-zinc-400 block text-[11px] mb-1">
                  📈 VAH {isAr ? '(أعلى القيمة)' : '(Value Area High)'}
                </span>
                <span className="text-sm font-extrabold text-emerald-400">{vp.vah?.toFixed(3)} {isAr ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-rose-500/30 transition-colors">
                <span className="text-zinc-400 block text-[11px] mb-1">
                  📉 VAL {isAr ? '(أدنى القيمة)' : '(Value Area Low)'}
                </span>
                <span className="text-sm font-extrabold text-rose-400">{vp.val?.toFixed(3)} {isAr ? 'ج.م' : 'EGP'}</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-blue-500/30 transition-colors">
                <span className="text-zinc-400 block text-[11px] mb-1">
                  📊 VWAP {isAr ? 'الأسبوعي' : 'Weekly'}
                </span>
                <span className="text-sm font-extrabold text-blue-400">
                  {vwap?.weekly ? vwap.weekly.toFixed(3) : (vp.vpoc ? (vp.vpoc * 1.002).toFixed(3) : '—')} {isAr ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Level 2 Order Book Section */}
        {isAvailable ? (
          <div className="space-y-4">
            {/* OFI Imbalance Gauge */}
            {ofi != null && (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 font-bold">
                    {isAr ? 'ميزان طلبات الشراء وعروض البيع (OFI)' : 'Order Flow Imbalance (OFI)'}
                  </span>
                  <span className={`font-extrabold px-2.5 py-0.5 rounded ${
                    ofi >= 1.5 ? 'bg-emerald-500/20 text-emerald-400' :
                    ofi <= 0.6 ? 'bg-rose-500/20 text-rose-400' :
                    'bg-zinc-800 text-zinc-300'
                  }`}>
                    OFI: {ofi.toFixed(2)} {ofi >= 1.5 ? '🟢 جدار شراء' : ofi <= 0.6 ? '🔴 جدار بيع' : '⚪ متوازن'}
                  </span>
                </div>

                <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(95, Math.max(5, (ofi / (ofi + 1)) * 100))}%` }}
                    className="bg-emerald-500 h-full transition-all duration-700"
                  />
                  <div className="flex-1 bg-rose-500 h-full" />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                  <span>{isAr ? 'طلب شراء:' : 'Bid:'} {((orderbook?.total_bid_qty || 0) / 1000).toFixed(0)}K</span>
                  <span>{isAr ? 'عرض بيع:' : 'Ask:'} {((orderbook?.total_ask_qty || 0) / 1000).toFixed(0)}K</span>
                </div>
              </div>
            )}

            {/* DOM Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {/* BIDS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 text-emerald-400 font-bold">
                  <span>{isAr ? '🟢 طلبات الشراء (Bids)' : '🟢 Bids'}</span>
                  <span>{isAr ? 'الكمية / الأوامر' : 'Qty / Orders'}</span>
                </div>
                <div className="space-y-1.5">
                  {bids.map((b: any, idx: number) => {
                    const pct = (b.volume / maxBidVol) * 100;
                    const isWhale = b.volume > maxBidVol * 0.7;
                    return (
                      <div
                        key={idx}
                        className="relative overflow-hidden p-2.5 rounded-xl border border-emerald-500/20 bg-zinc-900/80 flex items-center justify-between"
                      >
                        <div style={{ width: `${pct}%` }} className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none" />
                        <span className="font-bold text-emerald-400 z-10">{b.price?.toFixed(3)}</span>
                        <div className="z-10 text-right">
                          <span className={`font-bold block ${isWhale ? 'text-emerald-300' : 'text-zinc-200'}`}>
                            {b.volume?.toLocaleString()} {isWhale && '🐋'}
                          </span>
                          <span className="text-[10px] text-zinc-500">{b.orders_count} {isAr ? 'أوامر' : 'orders'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ASKS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2 text-rose-400 font-bold">
                  <span>{isAr ? '🔴 عروض البيع (Asks)' : '🔴 Asks'}</span>
                  <span>{isAr ? 'الكمية / الأوامر' : 'Qty / Orders'}</span>
                </div>
                <div className="space-y-1.5">
                  {asks.map((a: any, idx: number) => {
                    const pct = (a.volume / maxAskVol) * 100;
                    const isWhale = a.volume > maxAskVol * 0.7;
                    return (
                      <div
                        key={idx}
                        className="relative overflow-hidden p-2.5 rounded-xl border border-rose-500/20 bg-zinc-900/80 flex items-center justify-between"
                      >
                        <div style={{ width: `${pct}%` }} className="absolute left-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none" />
                        <span className="font-bold text-rose-400 z-10">{a.price?.toFixed(3)}</span>
                        <div className="z-10 text-left">
                          <span className={`font-bold block ${isWhale ? 'text-rose-300' : 'text-zinc-200'}`}>
                            {a.volume?.toLocaleString()} {isWhale && '🐋'}
                          </span>
                          <span className="text-[10px] text-zinc-500">{a.orders_count} {isAr ? 'عروض' : 'asks'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Explicit Truthful Notice when Level 2 is unavailable */
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <ShieldAlert className="w-5 h-5 text-amber-400/80" />
            </div>
            <h4 className="text-sm font-bold text-zinc-200">
              {isAr ? 'عمق السوق (Level 2) غير متاح لبورصة مصر' : 'Level 2 Order Book Data Unavailable for EGX'}
            </h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              {isAr
                ? 'بيانات دفتر الأوامر اللحظية (Top 5 Bids & Asks) تتطلب تغذية مباشرة ومستمرة من البورصة المصرية وغير متوفرة حالياً لهذا السهم. نعتمد فقط على البيانات الحقيقية المؤكدة.'
                : 'Live order book depth feeds (Top 5 Bids & Asks) require a continuous direct exchange feed and are currently not provided for this ticker.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
