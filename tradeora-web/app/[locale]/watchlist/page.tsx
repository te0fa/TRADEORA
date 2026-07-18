'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStocks } from '@/hooks/useStocks';
import { StockTable } from '@/components/dashboard/StockTable';

interface WatchlistPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function WatchlistPage({ params }: WatchlistPageProps) {
  const { locale } = React.use(params);
  const t = useTranslations('watchlist');
  const tDashboard = useTranslations('dashboard');
  const { stocks, loading, error } = useStocks();
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);

  // Load watchlist symbols from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tradeora_watchlist');
      if (stored) {
        setWatchlistSymbols(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load watchlist symbols from localStorage:', e);
    }
  }, []);

  // Filter stocks by symbols in watchlist
  const watchlistedStocks = useMemo(() => {
    return stocks.filter(s => watchlistSymbols.includes(s.symbol.toUpperCase()));
  }, [stocks, watchlistSymbols]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl p-8 border border-white/5 max-w-lg mx-auto">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {t('errorTitle')}
        </h2>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          {tDashboard('retryButton')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-text-primary flex items-center gap-2">
          <span>⭐️</span>
          <span>{t('title')}</span>
        </h1>
        <p className="text-xs text-text-secondary mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Render stock table filtered to watchlist, showing loading skeletons if fetching */}
      <StockTable 
        stocks={watchlistedStocks} 
        loading={loading} 
        locale={locale} 
      />
    </div>
  );
}
