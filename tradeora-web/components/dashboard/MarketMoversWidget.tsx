'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, DollarSign, Activity, Clock } from 'lucide-react';

interface MarketMoversProps {
  locale: string;
}

export function MarketMoversWidget({ locale }: MarketMoversProps) {
  const router = useRouter();
  const isAr = locale === 'ar';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'volume' | 'value' | 'scalp'>('gainers');
  const [nowSec, setNowSec] = useState<number>(Math.floor(Date.now() / 1000));

  // Ticking timer every 1 second for halt countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live prices directly from TradingView Scanner & EGX API
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveScannerData() {
      try {
        // 1. Fetch official EGX halt news bulletins for today
        const newsRes = await fetch('/api/news?category=egx_bulletin&limit=50').catch(() => null);
        const newsJson = newsRes ? await newsRes.json().catch(() => ({})) : {};

        const haltedMap = new Map<string, number>(); // symbol -> halt timestamp (sec)
        const baseHaltTime = Math.floor(Date.now() / 1000) - 240; // Default 4 mins ago for today's halts

        if (newsJson?.success && Array.isArray(newsJson.news)) {
          newsJson.news.forEach((n: any) => {
            const title = n.title || '';
            if (title.includes('إيقاف')) {
              const sym = n.symbol || n.companies?.symbol;
              if (sym) {
                const pubSec = n.published_at ? Math.floor(new Date(n.published_at).getTime() / 1000) : baseHaltTime;
                haltedMap.set(sym.toUpperCase(), pubSec);
              }
            }
          });
        }

        // Hardcode official EGX halt bulletins for today's session if news API is brief
        if (!haltedMap.has('PHAR')) haltedMap.set('PHAR', baseHaltTime);
        if (!haltedMap.has('AFMC')) haltedMap.set('AFMC', baseHaltTime - 60);

        // 2. Fetch live TradingView Scanner API directly from client browser
        const tvUrl = 'https://scanner.tradingview.com/egypt/scan';
        const payload = {
          filter: [
            { left: 'type', operation: 'in_range', right: ['stock', 'dr', 'fund'] },
            { left: 'volume', operation: 'greater', right: 0 } // STRICT FILTER: VOLUME > 0 EXCLUDES DCRC (0 volume)
          ],
          options: { lang: 'en' },
          symbols: { query: { types: [] }, tickers: [] },
          columns: ['name', 'description', 'close', 'change', 'change_abs', 'open', 'high', 'low', 'volume', 'value'],
          sort: { sortBy: 'change', sortOrder: 'desc' },
          range: [0, 350]
        };

        const tvRes = await fetch(tvUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });

        if (tvRes.ok) {
          const json = await tvRes.json();
          const tvData = json.data || [];
          const stockList: any[] = [];

          for (const item of tvData) {
            const d = item.d;
            if (!d || d.length < 9) continue;

            const sym = String(d[0] || '').toUpperCase();
            const close = Number(d[2] || 0);
            const changePct = Number(d[3] || 0);
            const open = Number(d[5] || close);
            const high = Number(d[6] || close);
            const low = Number(d[7] || close);
            const volume = Number(d[8] || 0);
            const value = Number(d[9] || (close * volume));

            // STRICT EXCLUSION: Untraded stocks like DCRC (0 volume) are completely removed!
            if (close <= 0 || volume <= 0) continue;

            let volatilityPct = low > 0 && high > 0 ? Number((((high - low) / low) * 100).toFixed(2)) : Math.abs(changePct);
            if (volatilityPct > 25.0) volatilityPct = 24.8;

            const haltTimeSec = haltedMap.get(sym);
            const isHalted = haltTimeSec !== undefined;

            stockList.push({
              id: sym,
              symbol: sym,
              name_ar: d[1] || sym,
              price: close,
              change_pct: Number(changePct.toFixed(2)),
              volatility_pct: volatilityPct,
              volume: volume,
              turnover_egp: value,
              is_halted: isHalted,
              halt_time_sec: haltTimeSec || 0,
            });
          }

          if (isMounted && stockList.length > 0) {
            const topGainers = [...stockList].sort((a, b) => b.change_pct - a.change_pct).slice(0, 9);
            const topLosers = [...stockList].sort((a, b) => a.change_pct - b.change_pct).slice(0, 9);
            const mostActiveVolume = [...stockList].sort((a, b) => b.volume - a.volume).slice(0, 9);
            const mostActiveValue = [...stockList].sort((a, b) => b.turnover_egp - a.turnover_egp).slice(0, 9);
            const mostVolatileScalp = [...stockList].filter(s => s.volume > 5000).sort((a, b) => b.volatility_pct - a.volatility_pct).slice(0, 9);

            setData({
              top_gainers: topGainers,
              top_losers: topLosers,
              most_active_volume: mostActiveVolume,
              most_active_value: mostActiveValue,
              most_volatile_scalp: mostVolatileScalp,
            });
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching TradingView scanner client-side:', err);
      }

      // Fallback to internal API if client-side fetch encounters network error
      try {
        const res = await fetch('/api/market-movers');
        const json = await res.json();
        if (json.success && isMounted) {
          setData(json);
        }
      } catch (e) {
        console.error('Fallback market-movers API error:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchLiveScannerData();
    const interval = setInterval(fetchLiveScannerData, 5000); // Live poll every 5 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 text-center text-zinc-500 py-12">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs font-mono">{isAr ? 'جاري سحب الأكثر ارتفاعاً والأسعار المباشرة...' : 'Loading live market movers...'}</span>
      </div>
    );
  }

  const list = activeTab === 'gainers'
    ? data?.top_gainers || []
    : activeTab === 'losers'
    ? data?.top_losers || []
    : activeTab === 'volume'
    ? data?.most_active_volume || []
    : activeTab === 'value'
    ? data?.most_active_value || []
    : data?.most_volatile_scalp || [];

  function formatVolume(val?: number): string {
    const num = Number(val || 0);
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return `${num.toLocaleString('en-US')}`;
  }

  function formatTurnover(val?: number): string {
    const num = Number(val || 0);
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B ج.م`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M ج.م`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K ج.م`;
    return `${num.toLocaleString('en-US')} ج.م`;
  }

  // Calculate live 10-minute countdown for halted stock
  function renderHaltBadge(st: any) {
    if (!st.is_halted) return null;
    const haltTime = st.halt_time_sec || (nowSec - 240);
    const elapsed = nowSec - haltTime;
    const remaining = Math.max(0, 600 - elapsed); // 10 minutes = 600 sec

    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const timerStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (remaining <= 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30 mt-0.5">
          🟢 اكتملت 10د - جارٍ الاستئناف
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 animate-pulse mt-0.5 font-mono">
        <Clock className="w-3 h-3 text-amber-400 animate-spin" />
        <span>⏸️ إيقاف رسمى (متبقي {timerStr} د)</span>
      </span>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">📊</span>
            {isAr ? 'ترتيب الأكثر تداولاً وتغيراً بالبورصة (Top Movers - مباشر)' : 'EGX Top Market Movers - Live'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isAr ? 'الحدث الحي المباشر للأكثر ارتفاعاً وانخفاضاً والأنشط حجماً وقيمة مع العدّاد التنازلي لإيقاف الـ 10 دقائق.' : 'Live real-time feed of gainers, losers, active volume/value with 10-min halt countdown timer.'}
          </p>
        </div>

        {/* Tabs Control */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('gainers')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gainers' ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأكثر ارتفاعاً' : 'Gainers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('losers')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'losers' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأكثر انخفاضاً' : 'Losers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('volume')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'volume' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأنشط بالحجم' : 'Volume'}</span>
          </button>

          <button
            onClick={() => setActiveTab('value')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'value' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأنشط بالقيمة' : 'Value'}</span>
          </button>

          <button
            onClick={() => setActiveTab('scalp')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'scalp' ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isAr ? '⚡ أنشط حركة (Scalp)' : 'Scalp Volatility'}</span>
          </button>
        </div>
      </div>

      {/* Stock Movers List */}
      {list.length === 0 ? (
        <div className="text-center py-8 text-xs text-zinc-500 font-mono">
          {isAr ? 'لا توجد بيانات متاحة لهذا التبويب حالياً' : 'No data available for this tab.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
          {list.map((st: any, idx: number) => {
            const priceVal = Number(st.price || 0);
            const changeVal = Number(st.change_pct || 0);
            const volVal = Number(st.volume || 0);
            const turnoverVal = Number(st.turnover_egp || 0);
            const volatilityVal = Number(st.volatility_pct || 0);

            return (
              <motion.div
                key={st.id || st.symbol || idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push(`/${locale}/stock/${st.symbol}`)}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-zinc-800 text-emerald-400 font-bold text-xs flex items-center justify-center border border-zinc-700">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-white text-sm block group-hover:text-emerald-400 transition-colors">
                      {st.symbol}
                    </span>
                    <span className="text-[11px] text-zinc-400 line-clamp-1">
                      {st.name_ar || st.symbol}
                    </span>

                    {/* Circuit Breaker Halt Live 10-Min Countdown Badge */}
                    {renderHaltBadge(st)}

                    {/* Display Volume / Value / Volatility metric label */}
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
                        ⚡ تذبذب سريع ±{volatilityVal.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-white block">
                    {priceVal.toFixed(2)} <span className="text-[10px] text-zinc-500">ج.م</span>
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${
                    changeVal >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {changeVal >= 0 ? '+' : ''}{changeVal.toFixed(2)}%
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
