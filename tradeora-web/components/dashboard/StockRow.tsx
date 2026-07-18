'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { CompanyWithPrice } from '@/lib/queries';
import { QualityDot } from '../ui/QualityDot';
import { Badge } from '../ui/Badge';
import { 
  formatVolume, 
  formatRelativeTime, 
  formatPrice, 
  formatChange, 
  formatChangePercent 
} from '@/lib/formatters';

interface StockRowProps {
  stock: CompanyWithPrice;
}

export function StockRow({ stock }: StockRowProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('sources');
  const tGlobal = useTranslations();
  const tTooltip = useTranslations('sourceTooltips');

  const name = locale === 'ar' ? (stock.name_ar || stock.name_en || '') : (stock.name_en || stock.name_ar || '');
  const price = stock.priceRecord?.close_price || 0;
  const change = stock.priceRecord?.change_value ?? null;
  const changePercent = stock.priceRecord?.change_percent ?? null;
  const volume = stock.priceRecord?.volume ?? null;
  
  // Format source label and badge color variant
  const sourceKey = stock.priceRecord?.source || '';
  const sourceLabel = t(sourceKey) || sourceKey || '-';

  const badgeVariant = 
    sourceKey === 'egx_bulletin' 
      ? 'success' // Green
      : sourceKey === 'intraday_consensus' 
      ? 'primary' // Blue
      : sourceKey === 'tradingview' 
      ? 'warning' // Orange/Yellow
      : 'glass';

  // Quality flag
  const flag = stock.priceRecord?.data_quality_flag ?? null;

  const handleRowClick = () => {
    router.push(`/${locale}/stock/${stock.symbol.toLowerCase()}`);
  };

  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;

  return (
    <tr 
      onClick={handleRowClick}
      className="border-b border-white/5 hover:bg-white/[0.02] hover:shadow-[inset_0_0_20px_rgba(59,130,246,0.015)] transition-all duration-200 cursor-pointer group"
    >
      {/* Symbol */}
      <td className="px-4 sm:px-6 py-4 font-mono font-bold text-accent-blue group-hover:underline">
        {stock.symbol}
      </td>
      
      {/* Name + Shariah */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-text-primary text-sm font-semibold max-w-[150px] sm:max-w-xs truncate">
            {name}
          </span>
          {stock.is_shariah_compliant && (
            <span className="text-xs" title={tGlobal('stockDetail.shariahCompliant')}>☪️</span>
          )}
        </div>
      </td>

      {/* Current Price with ▲▼ arrow indicator */}
      <td className="px-4 sm:px-6 py-4 font-mono font-bold text-text-primary text-sm">
        <div className="flex items-center gap-1.5">
          <span>{formatPrice(price, locale)}</span>
          {isUp && <span className="text-up-green text-xs">▲</span>}
          {isDown && <span className="text-down-red text-xs">▼</span>}
          {stock.isLastResort && (
            <span className="text-[9px] text-yellow-500 font-medium bg-yellow-500/10 px-1 py-0.5 rounded border border-yellow-500/20">
              {locale === 'ar' ? 'آخر سعر' : 'Last'}
            </span>
          )}
        </div>
      </td>

      {/* Change value */}
      <td className={`px-4 sm:px-6 py-4 font-mono font-bold text-sm ${isUp ? 'text-up-green' : isDown ? 'text-down-red' : 'text-text-secondary'}`}>
        {formatChange(change, locale)}
      </td>

      {/* Change percent */}
      <td className={`px-4 sm:px-6 py-4 font-mono font-bold text-sm ${isUp ? 'text-up-green' : isDown ? 'text-down-red' : 'text-text-secondary'}`} dir="ltr">
        {formatChangePercent(changePercent, locale)}
      </td>

      {/* Volume */}
      <td className="px-4 sm:px-6 py-4 text-sm text-text-primary font-medium font-sans">
        {formatVolume(volume, locale)}
      </td>

      {/* Source Badge */}
      <td className="px-4 sm:px-6 py-4">
        {stock.priceRecord ? (
          <div className="relative group/tooltip inline-block">
            <Badge variant={badgeVariant}>
              {sourceLabel}
            </Badge>
            <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-52 p-2.5 text-[10px] leading-normal text-text-primary bg-surface-dark border border-white/10 rounded-lg shadow-xl backdrop-blur-md font-sans text-center">
              {tTooltip(sourceKey) || sourceLabel}
            </div>
          </div>
        ) : (
          '-'
        )}
      </td>

      {/* Data Quality */}
      <td className="px-4 sm:px-6 py-4">
        {stock.priceRecord ? (
          <QualityDot flag={flag} showText={false} />
        ) : (
          '-'
        )}
      </td>

      {/* Last Update */}
      <td className="px-4 sm:px-6 py-4 text-xs text-text-secondary font-medium font-sans">
        {stock.priceRecord?.fetched_at ? (
          formatRelativeTime(stock.priceRecord.fetched_at, locale, tGlobal)
        ) : (
          '-'
        )}
      </td>
    </tr>
  );
}
