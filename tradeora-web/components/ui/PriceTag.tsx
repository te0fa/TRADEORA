'use client';

import React from 'react';
import { formatPrice, formatChangePercent } from '@/lib/formatters';

interface PriceTagProps {
  price: number;
  change: number | null;
  changePercent: number | null;
  locale: string;
  isLastResort?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceTag({ 
  price, 
  change, 
  changePercent, 
  locale, 
  isLastResort = false,
  size = 'md' 
}: PriceTagProps) {
  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;
  
  const colorClass = isUp 
    ? 'text-up-green' 
    : isDown 
    ? 'text-down-red' 
    : 'text-text-secondary';

  const sizeClasses = {
    sm: {
      price: 'text-sm font-bold',
      percent: 'text-[11px] font-semibold'
    },
    md: {
      price: 'text-base font-bold',
      percent: 'text-xs font-semibold'
    },
    lg: {
      price: 'text-2xl sm:text-3xl font-extrabold',
      percent: 'text-sm sm:text-base font-bold'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex flex-col ${locale === 'ar' ? 'items-start' : 'items-end'} font-sans`}>
      <div className="flex items-baseline gap-1">
        <span className={`${currentSize.price} text-text-primary tracking-tight`}>
          {formatPrice(price, locale)}
        </span>
        {isLastResort && (
          <span className="text-[10px] text-yellow-500 font-medium bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
            {locale === 'ar' ? 'آخر سعر متاح' : 'Last Known'}
          </span>
        )}
      </div>
      {changePercent !== null && (
        <span className={`${currentSize.percent} ${colorClass} flex items-center gap-0.5 mt-0.5`} dir="ltr">
          <span>{isUp ? '▲' : isDown ? '▼' : ''}</span>
          <span>{formatChangePercent(changePercent, locale)}</span>
        </span>
      )}
    </div>
  );
}
