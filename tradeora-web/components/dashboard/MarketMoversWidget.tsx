'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, DollarSign, Activity, Clock, RefreshCw, Wifi } from 'lucide-react';

interface StockMover {
  id: string;
  symbol: string;
  name_ar: string;
  sector: string;
  price: number;
  change_pct: number;
  volatility_pct: number;
  volume: number;
  turnover_egp: number;
  is_halted: boolean;
  halt_time_sec: number | null;
}

interface MarketMoversProps {
  locale: string;
}

type Tab = 'gainers' | 'losers' | 'volume' | 'value' | 'scalp';

export function MarketMoversWidget({ locale }: MarketMoversProps) {
  const router = useRouter();
  const isAr = locale === 'ar';

  const [lists, setLists] = useState<Record<Tab, StockMover[]>>({
    gainers: [],
    losers: [],
    volume: [],
    value: [],
    scalp: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('gainers');
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [dataSource, setDataSource] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Ticking every second for halt countdown
  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Core live price enrichment ───────────────────────────────────────────
  // After getting the base list from /api/market-movers,
  // we enrich prices using /api/stock-live for the visible tab symbols
  // This guarantees prices match the individual stock pages 100%
  const enrichPricesRef = useRef(false);
  const enrichPrices = useCallback(async (baseList: StockMover[]): Promise<StockMover[]> => {
    if (baseList.length === 0) return baseList;

    // Fetch live price for each symbol via stock-live API (same source as stock detail pages)
    const enriched = await Promise.allSettled(
      baseList.map(async (st) => {
        try {
          const res = await fetch(`/api/stock-live?symbol=${st.symbol}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          if (!res.ok) return st;
          const live = await res.json();
          if (live.close && live.close > 0 && live.volume > 0) {
            return {
              ...st,
              price: live.close,
              change_pct: Number((live.changePct ?? st.change_pct).toFixed(2)),
              volume: live.volume ?? st.volume,
            };
          }
          // If 0 volume from live → this stock didn't trade today, exclude
          if (live.volume === 0) return null;
        } catch {
          // network error → keep base data
        }
        return st;
      })
    );

    return enriched
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .filter((st): st is StockMover => st !== null && st.price > 0);
  }, []);

  // ── Main fetch ───────────────────────────────────────────────────────────
  const fetchMovers = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);

    try {
      // Step 1: Fetch sorted lists from our server-side API
      const res = await fetch('/api/market-movers', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      if (!res.ok) throw new Error('API error');
      const json = await res.json();

      if (!json.success) throw new Error('No success');

      setDataSource(json.source || 'api');

      // Step 2: Enrich the VISIBLE tab's stocks with real-time prices from stock-live
      // We enrich all tabs so switching tabs shows live prices immediately
      const rawGainers: StockMover[]  = json.top_gainers || [];
      const rawLosers: StockMover[]   = json.top_losers || [];
      const rawVolume: StockMover[]   = json.most_active_volume || [];
      const rawValue: StockMover[]    = json.most_active_value || [];
      const rawScalp: StockMover[]    = json.most_volatile_scalp || [];

      // Enrich all in parallel
      const [gainers, losers, volume, value, scalp] = await Promise.all([
        enrichPrices(rawGainers),
        enrichPrices(rawLosers),
        enrichPrices(rawVolume),
        enrichPrices(rawValue),
        enrichPrices(rawScalp),
      ]);

      setLists({ gainers, losers, volume, value, scalp });
      setLastUpdated(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setLoading(false);
    } catch (err) {
      console.error('Market movers fetch error:', err);
      setLoading(false);
    } finally {
      if (isManual) setIsRefreshing(false);
    }
  }, [enrichPrices]);

  useEffect(() => {
    fetchMovers();
    // Poll every 10 seconds — enrich ensures prices are always live
    const interval = setInterval(() => fetchMovers(), 10000);
    return () => clearInterval(interval);
  }, [fetchMovers]);

  // ── Formatting helpers ────────────────────────────────────────────────────
  function formatVolume(val: number): string {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return val.toLocaleString('en-US');
  }

  function formatTurnover(val: number): string {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B ج.م`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M ج.م`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K ج.م`;
    return `${val.toLocaleString('en-US')} ج.م`;
  }

  // ── Live 10-minute countdown for official halt ───────────────────────────
  function HaltBadge({ st }: { st: StockMover & { halt_source?: string } }) {
    if (!st.is_halted) return null;

    // halt_time_sec: exact Unix time of halt (from TV flag or EGX bulletin DB)
    const haltTime = st.halt_time_sec || (nowSec - 300);
    const elapsed = nowSec - haltTime;
    const remaining = Math.max(0, 600 - elapsed); // 600s = 10 minutes

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const pad = (n: number) => String(n).padStart(2, '0');

    // Source label shown in badge
    const sourceTag = st.halt_source === 'tradingview_official'
      ? '📡 TradingView'
      : st.halt_source === 'egx_bulletin_db'
      ? '🏛️ بيان البورصة'
      : '⏸️';

    if (remaining <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 mt-0.5">
          🟢 اكتملت 10د — جارٍ الاستئناف
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 mt-0.5 font-mono">
        <Clock className="w-3 h-3 shrink-0 animate-pulse" />
        {sourceTag} إيقاف · متبقي {pad(mins)}:{pad(secs)}
      </span>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-zinc-800 animate-pulse" />
          <div className="h-5 w-64 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  const list = lists[activeTab] || [];

  const tabs: { key: Tab; labelAr: string; labelEn: string; color: string; icon: React.ReactNode }[] = [
    { key: 'gainers', labelAr: 'الأكثر ارتفاعاً', labelEn: 'Gainers', color: 'emerald', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'losers',  labelAr: 'الأكثر انخفاضاً', labelEn: 'Losers',  color: 'rose',    icon: <TrendingDown className="w-3.5 h-3.5" /> },
    { key: 'volume',  labelAr: 'الأنشط بالحجم',   labelEn: 'Volume',  color: 'blue',    icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'value',   labelAr: 'الأنشط بالقيمة',  labelEn: 'Value',   color: 'amber',   icon: <DollarSign className="w-3.5 h-3.5" /> },
    { key: 'scalp',   labelAr: '⚡ أنشط حركة',    labelEn: 'Scalp',   color: 'purple',  icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  const activeColor: Record<string, string> = {
    emerald: 'bg-emerald-500 text-black shadow-emerald-500/20',
    rose:    'bg-rose-500 text-white shadow-rose-500/20',
    blue:    'bg-blue-500 text-white shadow-blue-500/20',
    amber:   'bg-amber-500 text-black shadow-amber-500/20',
    purple:  'bg-purple-500 text-white shadow-purple-500/20',
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">📊</span>
            {isAr ? 'الأكثر تداولاً وتغيراً بالبورصة — مباشر' : 'EGX Top Market Movers — Live'}
          </h2>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-xs text-zinc-400">
              {isAr
                ? 'أسعار لحظية مباشرة · تتحدث كل 10 ثوانٍ · حجم > 0 فقط'
                : 'Real-time prices · updates every 10s · volume > 0 only'}
            </p>
            {/* Live indicator */}
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {dataSource === 'tv_live' ? 'TradingView Live' : 'EGX Today'}
            </span>
            {lastUpdated && (
              <span className="text-[10px] text-zinc-500 font-mono">آخر تحديث: {lastUpdated}</span>
            )}
          </div>
        </div>

        {/* Manual refresh button */}
        <button
          onClick={() => fetchMovers(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isAr ? 'تحديث' : 'Refresh'}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
              activeTab === t.key
                ? `${activeColor[t.color]}`
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t.icon}
            <span>{isAr ? t.labelAr : t.labelEn}</span>
          </button>
        ))}
      </div>

      {/* ── Stock cards ── */}
      {list.length === 0 ? (
        <div className="text-center py-10 text-xs text-zinc-500 font-mono flex flex-col items-center gap-2">
          <Wifi className="w-6 h-6 text-zinc-700" />
          {isAr ? 'لا توجد أسهم نشطة بحجم تداول فعلي' : 'No actively traded stocks found'}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono"
          >
            {list.map((st, idx) => {
              const priceVal     = Number(st.price || 0);
              const changeVal    = Number(st.change_pct || 0);
              const volVal       = Number(st.volume || 0);
              const turnoverVal  = Number(st.turnover_egp || 0);
              const volatilityVal = Number(st.volatility_pct || 0);
              const isUp         = changeVal >= 0;

              return (
                <motion.div
                  key={st.symbol}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/${locale}/stock/${st.symbol}`)}
                  className={`p-4 rounded-2xl bg-zinc-900/80 border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    st.is_halted
                      ? 'border-amber-500/40 bg-amber-950/20'
                      : 'border-zinc-800 hover:border-emerald-500/40'
                  }`}
                >
                  {/* Left: rank + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-7 h-7 shrink-0 rounded-xl font-bold text-xs flex items-center justify-center border ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      idx === 1 ? 'bg-zinc-600/30 text-zinc-300 border-zinc-600/30' :
                      idx === 2 ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {idx + 1}
                    </span>

                    <div className="min-w-0">
                      <span className="font-bold text-white text-sm block group-hover:text-emerald-400 transition-colors">
                        {st.symbol}
                      </span>
                      <span className="text-[11px] text-zinc-400 block truncate max-w-[130px]">
                        {st.name_ar}
                      </span>

                      {/* Halt countdown badge */}
                      <HaltBadge st={st} />

                      {/* Metric sub-label per tab */}
                      {activeTab === 'volume' && (
                        <span className="text-[10px] text-blue-400 font-bold block mt-0.5">
                          📦 {formatVolume(volVal)} سهم
                        </span>
                      )}
                      {activeTab === 'value' && (
                        <span className="text-[10px] text-amber-400 font-bold block mt-0.5">
                          💰 {formatTurnover(turnoverVal)}
                        </span>
                      )}
                      {activeTab === 'scalp' && (
                        <span className="text-[10px] text-purple-400 font-bold block mt-0.5">
                          ⚡ تذبذب ±{volatilityVal.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: price + change */}
                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-white block">
                      {priceVal.toFixed(2)} <span className="text-[10px] text-zinc-500">ج.م</span>
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                      isUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {isUp ? '+' : ''}{changeVal.toFixed(2)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
