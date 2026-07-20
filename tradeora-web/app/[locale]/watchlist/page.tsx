'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Star, Search, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  };

  return (
    <div className="w-full max-w-4xl mx-auto font-sans text-text-primary pb-20" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Title */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
          <Star className="w-8 h-8 text-accent-gold fill-accent-gold" />
          <span>{isAr ? 'قائمة المراقبة الشخصية' : 'Personal Watchlist'}</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          {isAr 
            ? `تتبع الأسعار والتغير اليومي لـ ${stocks.length} سهم قمت بمراقبتها.`
            : `Track prices and daily variations for your ${stocks.length} monitored assets.`}
        </p>
      </motion.div>

      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-accent-gold rounded-full animate-spin"></div>
          <span className="text-sm text-zinc-400">{isAr ? 'جاري تحميل قائمة المراقبة...' : 'Loading watchlist...'}</span>
        </div>
      ) : stocks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card hoverEffect={false} className="text-center py-20 p-10 max-w-lg mx-auto flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 text-accent-gold">
              <Star className="w-8 h-8" />
            </div>
            <p className="text-lg text-white font-bold mb-3">
              {isAr ? 'قائمة المراقبة فارغة حالياً' : 'Your watchlist is empty'}
            </p>
            <p className="text-sm text-zinc-400 max-w-xs leading-relaxed mb-8">
              {isAr 
                ? 'لم تقم بإضافة أي سهم للمراقبة بعد. انتقل لفرز الأسهم وابدأ بإضافة شركاتك المفضلة.' 
                : 'You haven\'t added any stocks yet. Use the screener to explore and add your favorite assets.'}
            </p>
            <Button variant="gold" onClick={() => router.push(`/${locale}/screener`)}>
              <Search className="w-4 h-4" />
              {isAr ? 'استكشف وافرز الأسهم' : 'Explore Stocks'}
            </Button>
          </Card>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          <AnimatePresence>
            {stocks.map(s => (
              <motion.div 
                variants={itemVariants}
                key={s.id}
                layout
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <Card 
                  hoverEffect={true}
                  className="flex items-center justify-between p-5 cursor-pointer group"
                  onClick={() => router.push(`/${locale}/stock/${s.symbol}`)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-blue/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-white font-black text-sm tracking-widest shadow-lg shadow-accent-blue/10">
                      {s.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-base text-white font-extrabold group-hover:text-accent-blue transition-colors font-mono">
                          {s.symbol}
                        </p>
                        <span className="text-[10px] text-zinc-500 font-mono px-2 py-0.5 bg-surface-dark rounded-md border border-white/5">
                          {new Date(s.added_at).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 max-w-[200px] truncate">
                        {isAr ? s.companies?.name_ar : s.companies?.name_en}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-left font-mono">
                      <p className="text-lg text-white font-bold">
                        {s.close > 0 ? `${s.close.toFixed(2)} EGP` : '—'}
                      </p>
                      {s.close > 0 && (
                        <p className={`text-xs font-bold mt-1 flex items-center justify-end gap-1 ${
                          s.change > 0 ? 'text-up-green' : s.change < 0 ? 'text-down-red' : 'text-zinc-400'
                        }`}>
                          {s.change > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : s.change < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
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
                      className="p-3 bg-white/5 hover:bg-down-red/10 text-zinc-500 hover:text-down-red rounded-xl transition-all cursor-pointer border border-transparent hover:border-down-red/20 shrink-0"
                      title={isAr ? 'حذف من القائمة' : 'Remove item'}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
