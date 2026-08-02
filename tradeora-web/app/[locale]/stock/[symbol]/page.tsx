'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useStockDetail } from '@/hooks/useStockDetail';
import { StockHeader } from '@/components/stock/StockHeader';
import { PriceChart } from '@/components/stock/PriceChart';
import { DataSourcesPanel } from '@/components/stock/DataSourcesPanel';
import { StockFundamentals } from '@/components/stock/StockFundamentals';
import { StockNewsPanel } from '@/components/stock/StockNewsPanel';
import { Level2OrderBook } from '@/components/stock/Level2OrderBook';
import { SeasonalityWidget } from '@/components/stock/SeasonalityWidget';
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

export interface LiveStockTick {
  close: number;
  changePct: number;
  changeAbs: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  updatedAt: string;
}

export default function StockDetailPage({ params }: StockDetailPageProps) {
  const { symbol, locale } = React.use(params);
  const t = useTranslations('stockDetail');
  const tGlobal = useTranslations();
  const tTooltip = useTranslations('sourceTooltips');
  
  const { company, intradayData, historicalPrices, loading, error, refetch } = useStockDetail(symbol);

  // ── Shared real-time live price (TradingView WebSocket + REST fallback) ──
  const [liveTick, setLiveTick] = useState<LiveStockTick | null>(null);

  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;

    const formatMessage = (func: string, args: any[]) => {
      const content = JSON.stringify({ m: func, p: args });
      return `~m~${content.length}~m~${content}`;
    };

    const tvSymbol = `EGX:${symbol.toUpperCase()}`;

    try {
      ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket');
      const quoteSession = 'qs_' + Math.random().toString(36).substring(2, 12);

      ws.onopen = () => {
        if (!active || !ws) return;
        ws.send(formatMessage('set_auth_token', ['unauthorized_user_token']));
        ws.send(formatMessage('quote_create_session', [quoteSession]));
        ws.send(formatMessage('quote_set_fields', [
          quoteSession,
          'ch', 'chp', 'lp', 'open_price', 'high_price', 'low_price', 'prev_close_price', 'volume'
        ]));
        ws.send(formatMessage('quote_add_symbols', [quoteSession, tvSymbol]));
      };

      ws.onmessage = (event) => {
        if (!active) return;
        const str = String(event.data);

        // Ping-pong handler
        if (str.includes('~h~')) {
          const parts = str.split('~h~');
          for (let i = 1; i < parts.length; i++) {
            const pingId = parts[i].split('~m~')[0];
            if (pingId && ws && ws.readyState === WebSocket.OPEN) {
              ws.send(`~m~${pingId.length + 4}~m~~h~${pingId}`);
            }
          }
        }

        // Parse qsd tick packets
        const packets = str.split(/~m~\d+~m~/).filter(Boolean);
        for (const packet of packets) {
          try {
            const parsed = JSON.parse(packet);
            if (parsed.m === 'qsd' && parsed.p && parsed.p[1]) {
              const v = parsed.p[1].v;
              if (v) {
                setLiveTick((prev) => {
                  const close = v.lp != null ? v.lp : (prev?.close ?? 0);
                  const changePct = v.chp != null ? v.chp : (prev?.changePct ?? 0);
                  const changeAbs = v.ch != null ? v.ch : (prev?.changeAbs ?? 0);
                  const open = v.open_price != null ? v.open_price : (prev?.open ?? close);
                  const high = v.high_price != null ? v.high_price : (prev?.high ?? close);
                  const low = v.low_price != null ? v.low_price : (prev?.low ?? close);
                  const volume = v.volume != null ? v.volume : (prev?.volume ?? 0);
                  const updatedAt = new Date().toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  });

                  return { close, changePct, changeAbs, open, high, low, volume, updatedAt };
                });
              }
            }
          } catch { /* skip non-JSON */ }
        }
      };
    } catch (e) {
      console.error('TradingView WS connection error:', e);
    }

    // ── REST Poll Fallback ──
    const pollREST = async () => {
      try {
        const res = await fetch(`/api/stock-live?symbol=${encodeURIComponent(symbol)}`, { cache: 'no-store' });
        if (res.ok && active) {
          const data = await res.json();
          if (data?.close != null) {
            setLiveTick((prev) => ({
              close: data.close,
              changePct: data.changePct,
              changeAbs: data.changeAbs,
              open: data.open ?? prev?.open ?? data.close,
              high: data.high ?? prev?.high ?? data.close,
              low: data.low ?? prev?.low ?? data.close,
              volume: data.volume ?? prev?.volume ?? 0,
              updatedAt: data.updatedAt
            }));
          }
        }
      } catch { /* silent */ }
    };

    pollREST();
    const pollId = setInterval(pollREST, 1000);

    return () => {
      active = false;
      clearInterval(pollId);
      if (ws) ws.close();
    };
  }, [symbol, locale]);


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
        <StockHeader company={company} liveTick={liveTick} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <PriceChart 
          symbol={symbol}
          companyId={company.id}
          intradayData={intradayData} 
          historicalPrices={historicalPrices} 
          locale={locale} 
          fundamentals={company.fundamentals}
          priceRecord={company.priceRecord}
          liveTick={liveTick}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <Level2OrderBook symbol={symbol} isAr={locale === 'ar'} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <SeasonalityWidget symbol={symbol} isAr={locale === 'ar'} />
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
