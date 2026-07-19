'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStockDetail } from '@/hooks/useStockDetail';
import { StockHeader } from '@/components/stock/StockHeader';
import { PriceChart } from '@/components/stock/PriceChart';
import { DataSourcesPanel } from '@/components/stock/DataSourcesPanel';
import { StockFundamentals } from '@/components/stock/StockFundamentals';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toEasternArabic, formatPrice } from '@/lib/formatters';

interface StockDetailPageProps {
  params: Promise<{
    symbol: string;
    locale: string;
  }>;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol, locale } = React.use(params);
  const t = useTranslations('stockDetail');
  const tGlobal = useTranslations();
  const tTooltip = useTranslations('sourceTooltips');
  
  const { company, intradayData, historicalPrices, loading, error, refetch } = useStockDetail(symbol);

  // Sorting state for the Price History Table
  const [sortKey, setSortKey] = useState<string>('price_date');
  const [sortAsc, setSortAsc] = useState<boolean>(false); // default latest date first
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Header sort action
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false); // default desc
    }
    setCurrentPage(1);
  };

  // Sort historical history
  const sortedHistory = useMemo(() => {
    if (!historicalPrices) return [];
    return [...historicalPrices].sort((a: any, b: any) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      if (sortKey === 'price_date') {
        valA = new Date(a.price_date).getTime();
        valB = new Date(b.price_date).getTime();
      } else {
        valA = valA ?? 0;
        valB = valB ?? 0;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [historicalPrices, sortKey, sortAsc]);

  // Paginated daily prices
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedHistory.slice(start, start + pageSize);
  }, [sortedHistory, currentPage]);

  const totalPages = Math.ceil(sortedHistory.length / pageSize);

  // Formatting helper for numbers
  const formatNum = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-US');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        {/* Header Skeleton */}
        <Skeleton className="h-32 w-full" />
        {/* Chart Skeleton */}
        <Skeleton className="h-[400px] w-full" />
        {/* Source panel Skeleton */}
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center glass-card rounded-2xl p-8 border border-white/5 max-w-lg mx-auto">
        <span className="text-4xl mb-4">🔍</span>
        <h2 className="text-xl font-bold text-text-primary mb-2">
          {t('notFoundTitle')}
        </h2>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          {t('notFoundSubtitle')} ({symbol.toUpperCase()})
        </p>
        <button
          onClick={refetch}
          className="px-6 py-2.5 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
        >
          {t('refreshButton')}
        </button>
      </div>
    );
  }

  const renderSortHeader = (label: string, key: string) => {
    return (
      <th 
        onClick={() => handleSort(key)}
        className={`px-4 sm:px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-text-secondary cursor-pointer hover:text-text-primary transition-colors select-none ${locale === 'ar' ? 'text-right' : 'text-left'}`}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === key ? 'text-accent-blue' : 'text-text-secondary/40'}`} />
        </div>
      </th>
    );
  };

  return (
    <div className="w-full">
      {/* 1. Stock Info Header Card */}
      <StockHeader company={company} />

      {/* 2. Visual Charts Container */}
      <PriceChart 
        symbol={symbol}
        companyId={company.id}
        intradayData={intradayData} 
        historicalPrices={historicalPrices} 
        locale={locale} 
        fundamentals={company.fundamentals}
      />

      {/* 3. Financial Fundamentals analysis */}
      <StockFundamentals
        fundamentals={company.fundamentals}
        currentPrice={company.priceRecord?.close_price ?? (historicalPrices && historicalPrices[0]?.close_price) ?? 0}
        locale={locale}
      />

      {/* 4. Real-time Comparison metrics */}
      <div className="mb-6">
        <DataSourcesPanel
          company={company}
          historicalPrices={historicalPrices}
          intradayPoints={intradayData?.points || []}
          intradayDate={intradayData?.date || null}
          locale={locale}
        />
      </div>

      {/* 4. Historical Data Grid Table */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          <span>📅</span>
          <span>{t('priceHistory')}</span>
        </h2>

        <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-white/[0.005]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                {renderSortHeader(t('date'), 'price_date')}
                {renderSortHeader(t('open'), 'open_price')}
                {renderSortHeader(t('high'), 'high_price')}
                {renderSortHeader(t('low'), 'low_price')}
                {renderSortHeader(t('close'), 'close_price')}
                {renderSortHeader(tGlobal('table.volume'), 'volume')}
                {renderSortHeader(tGlobal('table.source'), 'source')}
              </tr>
            </thead>
            <tbody>
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((p, i) => {
                  const dateStr = new Date(p.price_date).toLocaleDateString(
                    locale === 'ar' ? 'ar-EG' : 'en-US',
                    { year: 'numeric', month: 'short', day: 'numeric' }
                  );
                  return (
                    <tr key={p.id || i} className="border-b border-white/5 hover:bg-white/[0.01] transition text-sm">
                      <td className="px-6 py-3.5 font-medium text-text-primary font-sans">
                        {locale === 'ar' ? toEasternArabic(dateStr) : dateStr}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-text-primary">
                        {formatPrice(p.open_price, locale)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-text-primary">
                        {formatPrice(p.high_price, locale)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-text-primary">
                        {formatPrice(p.low_price, locale)}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-accent-blue font-bold">
                        {formatPrice(p.close_price, locale)}
                      </td>
                      <td className="px-6 py-3.5 text-text-primary font-sans">
                        {formatNum(p.volume)}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="relative group/tooltip inline-block">
                          <Badge 
                            variant={
                              p.source === 'egx_bulletin' 
                                ? 'success' 
                                : p.source === 'intraday_consensus' 
                                ? 'primary' 
                                : p.source === 'tradingview'
                                ? 'warning'
                                : 'glass'
                            }
                          >
                            {tGlobal('sources.' + p.source)}
                          </Badge>
                          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-52 p-2.5 text-[10px] leading-normal text-text-primary bg-surface-dark border border-white/10 rounded-lg shadow-xl backdrop-blur-md font-sans text-center">
                            {tTooltip(p.source) || p.source}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-secondary">
                    {t('noDataAvailable')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1 font-sans">
            <span className="text-xs text-text-secondary font-medium">
              {tGlobal('pageIndicator', { 
                current: locale === 'ar' ? toEasternArabic(currentPage) : currentPage, 
                total: locale === 'ar' ? toEasternArabic(totalPages) : totalPages 
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-text-primary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                {locale === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-text-primary disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
