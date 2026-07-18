'use client';

import React from 'react';
import { useStocks } from '@/hooks/useStocks';
import { MarketOverviewBar } from '@/components/dashboard/MarketOverviewBar';
import { StockTable } from '@/components/dashboard/StockTable';
import { useTranslations } from 'next-intl';

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function DashboardPage({ params }: PageProps) {
  const { locale } = React.use(params);
  const { stocks, loading, error, refetch } = useStocks();
  const t = useTranslations('dashboard');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl p-8 border border-white/5 max-w-lg mx-auto">
        <span className="text-4xl mb-4">⚠️</span>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {t('errorTitle')}
        </h2>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          {t('errorSubtitle')}
        </p>
        <button
          onClick={refetch}
          className="px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          {t('retryButton')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Title Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-primary">
            {t('title')}
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Market Overview statistics cards */}
      <MarketOverviewBar stocks={stocks} locale={locale} />

      {/* Main Stock Table */}
      <StockTable stocks={stocks} loading={loading} locale={locale} />
    </div>
  );
}
