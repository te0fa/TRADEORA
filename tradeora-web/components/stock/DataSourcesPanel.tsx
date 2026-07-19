'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CompanyWithPrice } from '@/lib/queries';
import { PriceRecord } from '@/lib/market-utils';
import { QualityDot } from '../ui/QualityDot';
import { Badge } from '../ui/Badge';
import { formatPrice, formatRelativeTime } from '@/lib/formatters';

interface DataSourcesPanelProps {
  company: CompanyWithPrice;
  historicalPrices: PriceRecord[]; // holds EOD & official
  intradayPoints: {
    time: string;
    consensus: number | null;
    tradingview: number | null;
    mubasher: number | null;
    investing: number | null;
  }[];
  intradayDate?: string | null;
  locale: string;
}

export function DataSourcesPanel({ 
  company, 
  historicalPrices, 
  intradayPoints, 
  intradayDate = null,
  locale 
}: DataSourcesPanelProps) {
  const t = useTranslations('stockDetail');
  const tGlobal = useTranslations();

  const consensusPrice = company.priceRecord?.close_price || null;

  // We want to extract the latest recorded price for each of the 4 main sources
  // Let's check both intraday points and historical records to find the latest for each source
  const sourcesToCompare = ['egx_bulletin', 'tradingview', 'mubasher', 'investing'] as const;

  const { resolvedSources, mostRecentSource, hasBigDifference } = useMemo(() => {
    // 1. Gather all unique latest prices from historical prices list
    // This handles official daily bulletin & EOD fallbacks
    const latestFromHistory: Record<string, PriceRecord> = {};
    historicalPrices.forEach(p => {
      if (!latestFromHistory[p.source]) {
        latestFromHistory[p.source] = p;
      }
    });

    // 2. Also check if there's latest intraday points (which are today's)
    // We can simulate a PriceRecord or extract price directly
    const latestIntradayPrice: Record<string, number | null> = {};
    const latestIntradayTime: Record<string, string | null> = {};
    
    if (intradayPoints && intradayPoints.length > 0) {
      const lastPoint = intradayPoints[intradayPoints.length - 1];
      latestIntradayPrice['tradingview'] = lastPoint.tradingview;
      latestIntradayPrice['mubasher'] = lastPoint.mubasher;
      latestIntradayPrice['investing'] = lastPoint.investing;
      
      latestIntradayTime['tradingview'] = lastPoint.time;
      latestIntradayTime['mubasher'] = lastPoint.time;
      latestIntradayTime['investing'] = lastPoint.time;
    }

    const list = sourcesToCompare.map(source => {
      let price: number | null = null;
      let priceDate: string | null = null;
      let fetchedAt: string | null = null;
      let flag: string | null = null;
      let isIntraday = false;

      // Extract details
      if (source !== 'egx_bulletin' && latestIntradayPrice[source] !== null && latestIntradayPrice[source] !== undefined) {
        price = latestIntradayPrice[source];
        priceDate = intradayDate || company.priceRecord?.price_date || null;
        fetchedAt = company.priceRecord?.fetched_at || null; // use today's update time
        flag = company.priceRecord?.data_quality_flag || null;
        isIntraday = true;
      } else {
        const histRecord = latestFromHistory[source];
        if (histRecord) {
          price = histRecord.close_price;
          priceDate = histRecord.price_date;
          fetchedAt = histRecord.fetched_at;
          flag = histRecord.data_quality_flag;
        }
      }

      // Calculate divergence relative to resolved consensus price
      let divergence: number | null = null;
      if (price !== null && consensusPrice !== null && consensusPrice > 0) {
        divergence = ((price - consensusPrice) / consensusPrice) * 100;
      }

      return {
        source,
        price,
        priceDate,
        fetchedAt,
        flag,
        divergence,
        isIntraday
      };
    });

    // Find the source with the latest fetchedAt timestamp
    let mostRecentSource: string | null = null;
    let maxTime = -1;
    list.forEach(s => {
      if (s.price !== null && s.fetchedAt) {
        const t = new Date(s.fetchedAt).getTime();
        if (t > maxTime) {
          maxTime = t;
          mostRecentSource = s.source;
        }
      }
    });

    // Check if price difference is > 2% between any two valid prices
    const activePrices = list
      .map(s => s.price)
      .filter((p): p is number => p !== null);
    
    let hasBigDifference = false;
    if (activePrices.length > 1) {
      const minPrice = Math.min(...activePrices);
      const maxPrice = Math.max(...activePrices);
      if (minPrice > 0 && ((maxPrice - minPrice) / minPrice) > 0.02) {
        hasBigDifference = true;
      }
    }

    return { resolvedSources: list, mostRecentSource, hasBigDifference };
  }, [historicalPrices, intradayPoints, consensusPrice, company.priceRecord, intradayDate]);

  const formatGregorianDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    
    return date.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
        <span>⚡</span>
        <span>{t('dataSourcesComparison')}</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resolvedSources.map((item) => {
          const hasPrice = item.price !== null && item.price !== undefined;
          const divValue = item.divergence !== null ? item.divergence : 0;
          const isNeutral = Math.abs(divValue) < 0.01;
          const isUp = divValue > 0 && !isNeutral;
          const isDown = divValue < 0 && !isNeutral;

          return (
            <div key={item.source} className="border border-white/5 bg-white/[0.01] rounded-xl p-4 flex flex-col justify-between hover:bg-white/[0.02] hover:border-white/10 transition duration-150">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-text-primary font-mono capitalize">
                  {tGlobal('sources.' + item.source)}
                </span>
                <div className="flex items-center gap-1">
                  {item.source === mostRecentSource && (
                    <Badge variant="success" className="text-[9px] font-extrabold uppercase bg-green-500/20 text-green-400 border border-green-500/30">
                      {locale === 'ar' ? 'الأحدث ✓' : 'Latest ✓'}
                    </Badge>
                  )}
                  {item.isIntraday && (
                    <Badge variant="primary" className="text-[9px] font-extrabold uppercase">
                      {locale === 'ar' ? 'لحظي' : 'Intraday'}
                    </Badge>
                  )}
                </div>
              </div>

              {hasPrice ? (
                <div className="flex flex-col gap-2">
                  {/* Price */}
                  <div className="text-xl font-extrabold text-text-primary font-sans">
                    {formatPrice(item.price, locale)}
                  </div>

                  {/* Divergence */}
                  <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2 mt-1">
                    <span className="text-text-secondary">{t('divergence')}</span>
                    {item.source === 'egx_bulletin' && !item.isIntraday ? (
                      <span className="text-text-secondary font-medium font-sans">-</span>
                    ) : (
                      <span 
                        className={`font-semibold font-sans ${isUp ? 'text-up-green' : isDown ? 'text-down-red' : 'text-text-secondary'}`}
                        dir="ltr"
                      >
                        {isNeutral ? '0.00%' : `${isUp ? '+' : ''}${divValue.toFixed(2)}%`}
                      </span>
                    )}
                  </div>

                  {/* Fetch Date */}
                  <div className="flex flex-col gap-1 text-[10px] text-text-secondary mt-2 pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center">
                      <span>{locale === 'ar' ? '📅 بيانات:' : '📅 Data date:'}</span>
                      <span className="font-semibold font-sans">{formatGregorianDate(item.priceDate)}</span>
                    </div>
                    {item.source === 'egx_bulletin' && (
                      <div className="text-green-400 font-semibold text-[9px] mt-0.5">
                        {locale === 'ar' ? '✓ آخر جلسة رسمية' : '✓ Latest official session'}
                      </div>
                    )}
                  </div>

                  {/* Quality Flag */}
                  {item.flag && (
                    <div className="mt-2.5">
                      <QualityDot flag={item.flag} showText={true} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-text-secondary italic py-6 text-center">
                  {t('noDataAvailable')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasBigDifference && (
        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
          {locale === 'ar' 
            ? '⚠️ فرق كبير بين المصادر قد يشير لاختلاف في تاريخ البيانات. المصدر الأقدم قد يكون من جلسة مختلفة.' 
            : '⚠️ Large difference between sources may indicate different data dates. The older source might be from a different session.'}
        </div>
      )}

      {/* Consensus Calculation Explanation */}
      <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-text-secondary leading-relaxed">
        <p className="font-bold text-text-primary mb-1 flex items-center gap-1.5">
          <span>ℹ️</span>
          <span>{locale === 'ar' ? 'كيف يتم احتساب سعر الإجماع (Consensus) الرئيسي؟' : 'How is the main Consensus Price calculated?'}</span>
        </p>
        <p className="text-[11px] text-text-secondary/80">
          {locale === 'ar'
            ? 'سعر السهم الرئيسي المعروض في المنصة هو نتيجة خوارزمية "توافق الآراء" (Consensus). يقوم النظام بمقارنة الأسعار من مصادر متعددة، ويستبعد تلقائياً أي سعر شاذ (ينحرف بأكثر من 1.5% عن الوسيط)، ثم يحسب متوسط الأسعار المتبقية لضمان أعلى دقة ممكنة وحماية من انقطاع أو تجميد أي مصدر.'
            : 'The main stock price displayed is the result of our "Consensus" algorithm. The system cross-validates prices from multiple sources, discards outliers (differing by >1.5% from the median), and averages the remaining prices to guarantee maximum accuracy and prevent source failures.'}
        </p>
      </div>

      <div className="mt-4 text-center text-[10px] text-text-secondary/60">
        {locale === 'ar'
          ? '⚡ EGX النشرة هي المصدر الرسمي للأسعار. الفروق بين المصادر طبيعية نتيجة تأخر تحديث كل مصدر.'
          : '⚡ EGX Bulletin is the official source of prices. Differences between sources are natural due to update delays.'}
      </div>
    </div>
  );
}
