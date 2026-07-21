'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useStockDetail } from '@/hooks/useStockDetail';
import { StockHeader } from '@/components/stock/StockHeader';
import { PriceChart } from '@/components/stock/PriceChart';
import { DataSourcesPanel } from '@/components/stock/DataSourcesPanel';
import { StockFundamentals } from '@/components/stock/StockFundamentals';
import { StockNewsPanel } from '@/components/stock/StockNewsPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toEasternArabic, formatPrice } from '@/lib/formatters';
import { motion } from 'framer-motion';

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

  const [sortKey, setSortKey] = useState<string>('price_date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

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

  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedHistory.slice(start, start + pageSize);
  }, [sortedHistory, currentPage]);

  const totalPages = Math.ceil(sortedHistory.length / pageSize);

  const formatNum = (num: number | null | undefined) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-US');
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-[450px] w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <Card hoverEffect={false} className="flex flex-col items-center justify-center py-20 text-center p-8 max-w-lg mx-auto">
        <span className="text-5xl mb-6">🔍</span>
        <h2 className="text-2xl font-black text-white mb-2">
          {t('notFoundTitle')}
        </h2>
        <p className="text-sm text-zinc-400 mb-8 max-w-sm">
          {t('notFoundSubtitle')} ({symbol.toUpperCase()})
        </p>
        <button
          onClick={refetch}
          className="px-8 py-3 btn-primary rounded-xl text-sm transition cursor-pointer"
        >
          {t('refreshButton')}
        </button>
      </Card>
    );
  }

  const renderSortHeader = (label: string, key: string) => {
    return (
      <th 
        onClick={() => handleSort(key)}
        className={`px-4 sm:px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 cursor-pointer hover:text-white transition-colors select-none ${locale === 'ar' ? 'text-right' : 'text-left'}`}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <ArrowUpDown className={`w-3.5 h-3.5 ${sortKey === key ? 'text-accent-blue' : 'opacity-30'}`} />
        </div>
      </th>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="w-full pb-20 flex flex-col gap-8"
    >
      <motion.div variants={itemVariants}>
        <StockHeader company={company} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PriceChart 
          symbol={symbol}
          companyId={company.id}
          intradayData={intradayData} 
          historicalPrices={historicalPrices} 
          locale={locale} 
          fundamentals={company.fundamentals}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <StockNewsPanel companyId={company.id} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <StockFundamentals
          fundamentals={company.fundamentals}
          currentPrice={company.priceRecord?.close_price ?? (historicalPrices && historicalPrices[0]?.close_price) ?? 0}
          locale={locale}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <DataSourcesPanel
          company={company}
          historicalPrices={historicalPrices}
          intradayPoints={intradayData?.points || []}
          intradayDate={intradayData?.date || null}
          locale={locale}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card hoverEffect={false} className="p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-accent-blue">📅</span>
            <span>{t('priceHistory')}</span>
          </h2>

          <div className="w-full overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {renderSortHeader(t('date'), 'price_date')}
                  {renderSortHeader(t('open'), 'open_price')}
                  {renderSortHeader(t('high'), 'high_price')}
                  {renderSortHeader(t('low'), 'low_price')}
                  {renderSortHeader(t('close'), 'close_price')}
                  {renderSortHeader(tGlobal('table.volume'), 'volume')}
                  {renderSortHeader(tGlobal('table.source'), 'source')}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedHistory.length > 0 ? (
                  paginatedHistory.map((p, i) => {
                    const dateStr = new Date(p.price_date).toLocaleDateString(
                      locale === 'ar' ? 'ar-EG' : 'en-US',
                      { year: 'numeric', month: 'short', day: 'numeric' }
                    );
                    return (
                      <tr key={p.id || i} className="hover:bg-white/5 transition-colors text-sm">
                        <td className="px-6 py-4 font-medium text-white font-sans">
                          {locale === 'ar' ? toEasternArabic(dateStr) : dateStr}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-300">
                          {formatPrice(p.open_price, locale)}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-300">
                          {formatPrice(p.high_price, locale)}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-300">
                          {formatPrice(p.low_price, locale)}
                        </td>
                        <td className="px-6 py-4 font-mono text-accent-blue font-bold text-base">
                          {formatPrice(p.close_price, locale)}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-sans">
                          {formatNum(p.volume)}
                        </td>
                        <td className="px-6 py-4">
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
                            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-52 p-3 text-xs leading-relaxed text-white bg-surface-elevated border border-white/10 rounded-xl shadow-2xl backdrop-blur-md font-sans text-center">
                              {tTooltip(p.source) || p.source}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      {t('noDataAvailable')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2 font-sans">
              <span className="text-sm text-zinc-500 font-medium">
                {tGlobal('pageIndicator', { 
                  current: locale === 'ar' ? toEasternArabic(currentPage) : currentPage, 
                  total: locale === 'ar' ? toEasternArabic(totalPages) : totalPages 
                })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl glass-input hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {locale === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl glass-input hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {locale === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
