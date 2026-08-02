'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, DollarSign, Activity } from 'lucide-react';

interface MarketMoversProps {
  locale: string;
}

export function MarketMoversWidget({ locale }: MarketMoversProps) {
  const router = useRouter();
  const isAr = locale === 'ar';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'volume' | 'value' | 'scalp'>('gainers');

  useEffect(() => {
    async function fetchMovers() {
      try {
        const res = await fetch('/api/market-movers');
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (err) {
        console.error('Error fetching market movers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMovers();
    const interval = setInterval(fetchMovers, 10000); // Live poll every 10 sec during trading hours
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 text-center text-zinc-500 py-12">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs font-mono">{isAr ? 'جاري سحب الأكثر ارتفاعاً وانخفاضاً بالبورصة...' : 'Loading market movers...'}</span>
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

  return (
    <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">📊</span>
            {isAr ? 'ترتيب الأكثر تداولاً وتغيراً بالبورصة (Top Movers)' : 'EGX Top Market Movers'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {isAr ? 'الحدث الحي والختامي للأسهم الأكثر ارتفاعاً وانخفاضاً، والأنشط حجماً وقيمة، وأسرع الأسهم تذبذباً للمضاربة (Scalping).' : 'Live & session-close feed of top gainers, losers, active volume/value, and scalp volatility movers.'}
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
