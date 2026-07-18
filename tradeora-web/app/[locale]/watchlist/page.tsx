'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Star, AlertTriangle, TrendingUp, Search, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function WatchlistPage() {
  const { locale } = useParams();
  const router = useRouter();
  const isAr = locale === 'ar';
  
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
  }, []);

  async function loadWatchlist() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/${locale}/auth`);
        return;
      }

      // Fetch watchlist items with company details
      const { data, error } = await supabase
        .from('watchlists')
        .select(`
          id, symbol, added_at,
          companies (
            id, name_ar, name_en, sector
          )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;

      // Enrich with last close/open prices to calculate daily percent change
      const enriched = await Promise.all(
        (data ?? []).map(async (w: any) => {
          if (!w.companies?.id) return { ...w, close: 0, change: 0 };
          
          const { data: price } = await supabase
            .from('market_prices')
            .select('close_price, open_price')
            .eq('company_id', w.companies.id)
            .order('price_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const close = price?.close_price ?? 0;
          const open  = price?.open_price  ?? close;
          const change = open > 0 ? ((close - open) / open) * 100 : 0;

          return { ...w, close, change };
        })
      );

      setStocks(enriched);
    } catch (e) {
      console.error('Error loading watchlist data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWatchlist(id: string) {
    try {
      await supabase.from('watchlists').delete().eq('id', id);
      setStocks(s => s.filter(x => x.id !== id));
    } catch (e) {
      console.error('Error removing from watchlist:', e);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto font-sans text-text-primary" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1 flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
          <span>{isAr ? '⭐ قائمة المراقبة الشخصية' : 'Personal Watchlist'}</span>
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {isAr 
            ? `تتبع الأسعار والتغير اليومي لـ ${stocks.length} سهم قمت بمراقبتها.`
            : `Track prices and daily variations for your ${stocks.length} monitored assets.`}
        </p>
      </div>

      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">{isAr ? 'جاري تحميل قائمة المراقبة...' : 'Loading watchlist...'}</span>
        </div>
      ) : stocks.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.01] to-transparent p-10 max-w-lg mx-auto">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Star className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-300 font-bold mb-2">
            {isAr ? 'قائمة المراقبة فارغة حالياً' : 'Your watchlist is empty'}
          </p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-normal mb-6">
            {isAr 
              ? 'لم تقم بإضافة أي سهم للمراقبة بعد. انتقل لفرز الأسهم وابدأ بإضافة شركاتك المفضلة.' 
              : 'You haven\'t added any stocks yet. Use the screener to explore and add your favorite assets.'}
          </p>
          <button
            onClick={() => router.push(`/${locale}/screener`)}
            className="px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 mx-auto"
          >
            <Search className="w-4 h-4" />
            <span>{isAr ? 'استكشف وافرز الأسهم' : 'Explore Stocks'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stocks.map(s => (
            <div key={s.id}
              onClick={() => router.push(`/${locale}/stock/${s.symbol}`)}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/[0.08] hover:border-white/15 cursor-pointer transition-all duration-200 group relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center text-white font-extrabold text-xs tracking-wide">
                  {s.symbol.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-extrabold group-hover:text-accent-blue transition-colors">
                      {s.symbol}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(s.added_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr ? s.companies?.name_ar : s.companies?.name_en}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-left font-mono">
                  <p className="text-sm text-white font-bold">
                    {s.close > 0 ? `${s.close.toFixed(2)} EGP` : '—'}
                  </p>
                  {s.close > 0 && (
                    <p className={`text-[10px] font-bold mt-0.5 flex items-center justify-end gap-0.5 ${
                      s.change > 0 ? 'text-green-400' : s.change < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {s.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : s.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                      <span>{s.change > 0 ? '+' : ''}{s.change.toFixed(2)}%</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    removeFromWatchlist(s.id);
                  }}
                  className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-xl transition cursor-pointer border border-transparent hover:border-red-500/20 shrink-0"
                  title={isAr ? 'حذف من القائمة' : 'Remove item'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
