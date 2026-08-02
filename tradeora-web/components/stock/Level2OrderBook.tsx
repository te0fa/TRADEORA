'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, TrendingUp, TrendingDown, Layers, HelpCircle, ChevronDown, ChevronUp, Zap, BarChart2 } from 'lucide-react';

interface Level2OrderBookProps {
  symbol: string;
  isAr?: boolean;
}

export function Level2OrderBook({ symbol, isAr = true }: Level2OrderBookProps) {
  const [orderbook, setOrderbook] = useState<any>(null);
  const [vpData, setVpData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [obRes, vpRes] = await Promise.all([
          fetch(`/api/orderbook?symbol=${symbol}`),
          fetch(`/api/volume-profile?symbol=${symbol}`)
        ]);

        const obJson = await obRes.json();
        const vpJson = await vpRes.json();

        if (obJson.success) setOrderbook(obJson.orderbook);
        if (vpJson.success) setVpData(vpJson);
      } catch (err) {
        console.error('Error fetching OrderBook & Volume Profile:', err);
      } finally {
        setLoading(false);
      }
    }

    if (symbol) fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 text-center text-zinc-500 py-12">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span className="text-xs font-mono">{isAr ? 'جاري سحب الشاشة الثانية وعمق السوق...' : 'Loading Level 2 Order Book...'}</span>
      </div>
    );
  }

  const bids = orderbook?.bids || [];
  const asks = orderbook?.asks || [];
  const ofi = orderbook?.ofi_ratio || 1.0;
  const maxBidVol = Math.max(...bids.map((b: any) => b.volume), 1);
  const maxAskVol = Math.max(...asks.map((a: any) => a.volume), 1);

  const vp = vpData?.volume_profile;
  const vwap = vpData?.vwap;

  return (
    <div className="space-y-6">
      {/* Top Banner & Order Flow Imbalance Gauge */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h2 className="text-lg font-bold text-white">
                {isAr ? 'عمق السوق اللحظي وحجم التداول (Level 2 & Volume Profile)' : 'Level 2 Depth & Volume Profile'}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              {isAr ? 'تحليل الشاشة الثانية، طلبات الشراء، عروض البيع، ونقاط التحكم السيولية (VPOC).' : 'Live 5-Level Depth of Market, Order Flow Imbalance, and VPOC analysis.'}
            </p>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold text-emerald-400 border border-emerald-500/30 transition-all"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل شرح المستويات' : 'Educational Guide'}</span>
            {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Collapsible Educational Guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-zinc-900/90 border border-emerald-500/20 p-5 rounded-2xl space-y-3 text-xs leading-relaxed text-zinc-300">
              <h3 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                {isAr ? 'كيف تقرأ وتتداول باستخدام هذه المستويات؟' : 'How to Trade Using Volume Profile & Level 2'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <span className="font-bold text-white block">🎯 VPOC (Volume Point of Control):</span>
                  <p className="text-zinc-400">السعر الذي تم التداول عنده بأكبر حجم سيولة. لو السهم قادم من أسفل 👈 أقوى مستوى دعم. لو قادم من أعلى 👈 مقاومة رئيسية.</p>
                </div>
                <div className="space-y-1.5">
                  <span className="font-bold text-white block">📈 VAH & VAL (Value Area 70%):</span>
                  <p className="text-zinc-400">منطقة القيمة السعرية. اختراق VAH بحجم عالي 👈 اختراق حقيقي ممتاز (Breakout). التداول تحت VAL 👈 إشارة ضعف شديد.</p>
                </div>
                <div className="space-y-1.5">
                  <span className="font-bold text-white block">⚖️ OFI Imbalance Ratio (معامل طلبات الشراء/البيع):</span>
                  <p className="text-zinc-400">نسبة كميات طلبات الشراء إلى عروض البيع. أعلى من 1.8 👈 جدار شراء مؤسسي قوي. أقل من 0.5 👈 جدار بيع وضغط تصريف.</p>
                </div>
                <div className="space-y-1.5">
                  <span className="font-bold text-white block">📊 VWAP (المتوسط المرجح بالحجم):</span>
                  <p className="text-zinc-400">مستوى السعر المرجعي المؤسسي. السعر فوق VWAP الأسبوعي والشهري 👈 اتجاه صاعد قوي ومؤسسي.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order Flow Imbalance Gauge */}
        <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 font-bold">{isAr ? 'ميزان طلبات الشراء وعروض البيع (OFI Ratio)' : 'Order Flow Imbalance'}</span>
            <span className={`font-extrabold px-2.5 py-0.5 rounded ${ofi >= 1.5 ? 'bg-emerald-500/20 text-emerald-400' : ofi <= 0.6 ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-300'}`}>
              OFI: {ofi} {ofi >= 1.5 ? '🟢 جدار شراء' : ofi <= 0.6 ? '🔴 جدار بيع' : '⚪ متوازن'}
            </span>
          </div>

          <div className="w-full bg-zinc-800 h-3 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${Math.min(95, Math.max(5, (ofi / (ofi + 1)) * 100))}%` }} 
              className="bg-emerald-500 h-full transition-all duration-500" 
            />
            <div className="flex-1 bg-rose-500 h-full" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-500">
            <span>طلب الشراء: {(orderbook?.total_bid_qty / 1000).toFixed(0)}K</span>
            <span>عرض البيع: {(orderbook?.total_ask_qty / 1000).toFixed(0)}K</span>
          </div>
        </div>

        {/* Level 2 DOM (Depth of Market) Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {/* BIDS TABLE (طلبات الشراء) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-emerald-400 font-bold">
              <span>{isAr ? '🟢 طلبات الشراء (Bids)' : 'Bids'}</span>
              <span>{isAr ? 'الكمية / الأوامر' : 'Qty / Orders'}</span>
            </div>
            <div className="space-y-1.5">
              {bids.map((b: any, idx: number) => {
                const pct = (b.volume / maxBidVol) * 100;
                const isWhale = b.volume > maxBidVol * 0.7;
                return (
                  <div key={idx} className="relative overflow-hidden p-2.5 rounded-xl border border-emerald-500/20 bg-zinc-900/80 flex items-center justify-between">
                    <div style={{ width: `${pct}%` }} className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none" />
                    <span className="font-bold text-emerald-400 z-10">{b.price.toFixed(2)}</span>
                    <div className="z-10 text-right">
                      <span className={`font-bold block ${isWhale ? 'text-emerald-300' : 'text-zinc-200'}`}>
                        {b.volume.toLocaleString()} {isWhale && '🐋'}
                      </span>
                      <span className="text-[10px] text-zinc-500">{b.orders_count} {isAr ? 'أوامر' : 'orders'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ASKS TABLE (عروض البيع) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-rose-400 font-bold">
              <span>{isAr ? '🔴 عروض البيع (Asks)' : 'Asks'}</span>
              <span>{isAr ? 'الكمية / الأوامر' : 'Qty / Orders'}</span>
            </div>
            <div className="space-y-1.5">
              {asks.map((a: any, idx: number) => {
                const pct = (a.volume / maxAskVol) * 100;
                const isWhale = a.volume > maxAskVol * 0.7;
                return (
                  <div key={idx} className="relative overflow-hidden p-2.5 rounded-xl border border-rose-500/20 bg-zinc-900/80 flex items-center justify-between">
                    <div style={{ width: `${pct}%` }} className="absolute left-0 top-0 bottom-0 bg-rose-500/10 pointer-events-none" />
                    <span className="font-bold text-rose-400 z-10">{a.price.toFixed(2)}</span>
                    <div className="z-10 text-left">
                      <span className={`font-bold block ${isWhale ? 'text-rose-300' : 'text-zinc-200'}`}>
                        {a.volume.toLocaleString()} {isWhale && '🐋'}
                      </span>
                      <span className="text-[10px] text-zinc-500">{a.orders_count} {isAr ? 'عروض' : 'asks'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Volume Profile & VWAP Summary Cards */}
        {vp && (
          <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-zinc-400 block text-[11px] mb-1">🎯 VPOC (نقطة التحكم)</span>
              <span className="text-sm font-extrabold text-amber-400">{vp.vpoc.toFixed(2)} ج.م</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-zinc-400 block text-[11px] mb-1">📈 VAH (أعلى القيمة)</span>
              <span className="text-sm font-extrabold text-emerald-400">{vp.vah.toFixed(2)} ج.م</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-zinc-400 block text-[11px] mb-1">📉 VAL (أدنى القيمة)</span>
              <span className="text-sm font-extrabold text-rose-400">{vp.val.toFixed(2)} ج.م</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <span className="text-zinc-400 block text-[11px] mb-1">📊 VWAP الأسبوعي</span>
              <span className="text-sm font-extrabold text-blue-400">
                {vwap?.weekly ? vwap.weekly.toFixed(2) : '-'} ج.م
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
