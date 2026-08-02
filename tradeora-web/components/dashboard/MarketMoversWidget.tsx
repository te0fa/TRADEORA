'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, DollarSign, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketMoversProps {
  locale: string;
}

export function MarketMoversWidget({ locale }: MarketMoversProps) {
  const router = useRouter();
  const isAr = locale === 'ar';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'volume' | 'value'>('gainers');

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
    const interval = setInterval(fetchMovers, 10000); // Live poll every 10 sec
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
    : data?.most_active_value || [];

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
            {isAr ? 'الحدث الحي للأسهم الأكثر ارتفاعاً وانخفاضاً والأنشط بقيمة وحجم التداول.' : 'Live feed of top gainers, losers, and most active stocks by volume & value.'}
          </p>
        </div>

        {/* Tabs Control */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('gainers')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'gainers' ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأكثر ارتفاعاً' : 'Gainers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('losers')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'losers' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأكثر انخفاضاً' : 'Losers'}</span>
          </button>

          <button
            onClick={() => setActiveTab('volume')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'volume' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأنشط بالحجم' : 'Volume'}</span>
          </button>

          <button
            onClick={() => setActiveTab('value')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'value' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>{isAr ? 'الأنشط بالقيمة' : 'Value'}</span>
          </button>
        </div>
      </div>

      {/* Stock Movers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono">
        {list.map((st: any, idx: number) => (
          <motion.div
            key={st.id || idx}
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
                  {st.name_ar}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-sm font-bold text-white block">
                {st.price.toFixed(2)} <span className="text-[10px] text-zinc-500">ج.م</span>
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${
                st.change_pct >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {st.change_pct >= 0 ? '+' : ''}{st.change_pct}%
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
