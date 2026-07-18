'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CompanyWithPrice } from '@/lib/queries';
import { PriceTag } from '../ui/PriceTag';
import { QualityDot } from '../ui/QualityDot';
import { Badge } from '../ui/Badge';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface StockHeaderProps {
  company: CompanyWithPrice;
}

export function StockHeader({ company }: StockHeaderProps) {
  const t = useTranslations('stockDetail');
  const tGlobal = useTranslations();
  const locale = useLocale();
  
  const symbol = company.symbol.toUpperCase();
  const namePrimary = locale === 'ar' ? (company.name_ar || company.name_en || '') : (company.name_en || company.name_ar || '');
  const nameSecondary = locale === 'ar' ? (company.name_en || '') : (company.name_ar || '');

  const [isWatchlisted, setIsWatchlisted] = useState(false);

  // Synchronize watchlist status from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tradeora_watchlist');
      const watchlist = stored ? JSON.parse(stored) : [];
      setIsWatchlisted(watchlist.includes(symbol));
    } catch (e) {
      console.error('Failed to load watchlist state from localStorage', e);
    }
  }, [symbol]);

  const handleToggleWatchlist = () => {
    try {
      const stored = localStorage.getItem('tradeora_watchlist');
      const watchlist = stored ? JSON.parse(stored) : [];
      let nextWatchlist = [...watchlist];
      if (watchlist.includes(symbol)) {
        nextWatchlist = nextWatchlist.filter(s => s !== symbol);
        setIsWatchlisted(false);
      } else {
        nextWatchlist.push(symbol);
        setIsWatchlisted(true);
      }
      localStorage.setItem('tradeora_watchlist', JSON.stringify(nextWatchlist));
    } catch (e) {
      console.error('Failed to save watchlist state to localStorage', e);
    }
  };

  const getMarketStatusLabel = () => {
    if (!company.priceRecord) return null;
    
    // Check market hours (Egypt local time)
    const cairoTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Cairo' });
    const d = new Date(cairoTime);
    const day = d.getDay(); // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
    const hour = d.getHours();
    
    // EGX is closed Friday (5) and Saturday (6)
    const isWeekend = [5, 6].includes(day);
    const isMarketHours = !isWeekend && hour >= 10 && hour < 15;
    
    if (isMarketHours) {
      return (
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {tGlobal('sources.' + company.priceRecord.source)}
        </span>
      );
    } else {
      const dateParts = company.priceRecord.price_date.split('-');
      let dayName = '';
      if (dateParts.length === 3) {
        const yr = parseInt(dateParts[0], 10);
        const mo = parseInt(dateParts[1], 10) - 1;
        const dy = parseInt(dateParts[2], 10);
        const pDate = new Date(yr, mo, dy);
        dayName = pDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' });
      }
      
      const labelText = locale === 'ar'
        ? `إغلاق ${dayName}`
        : `Closed (${dayName})`;
        
      return (
        <span className="text-[10px] text-text-secondary bg-white/5 px-2 py-0.5 rounded border border-white/5 flex items-center gap-1 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-text-secondary/40" />
          {labelText}
        </span>
      );
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex flex-col gap-3">
        {/* Name and Symbol Row */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary">
            {namePrimary}
          </h1>
          <span className="text-sm font-mono font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-accent-blue">
            {symbol}
          </span>
          {company.is_shariah_compliant && (
            <Badge variant="glass" className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
              {t('shariahCompliant')}
            </Badge>
          )}
        </div>

        {/* secondary name and ISIN code */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-text-secondary">
          {nameSecondary && <span className="font-medium">{nameSecondary}</span>}
          {nameSecondary && <span className="hidden sm:inline w-[1px] h-3 bg-white/10" />}
          {company.isin && (
            <span>
              {t('isin')}: <span className="font-mono font-semibold text-text-primary">{company.isin}</span>
            </span>
          )}
          {company.sector && (
            <>
              <span className="hidden sm:inline w-[1px] h-3 bg-white/10" />
              <span>
                {t('sector')}: <span className="font-semibold text-text-primary">{company.sector}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 self-start md:self-center">
        {/* Price display tag */}
        {company.priceRecord ? (
          <div className="flex items-center gap-4">
            <PriceTag
              price={company.priceRecord.close_price}
              change={company.priceRecord.change_value}
              changePercent={company.priceRecord.change_percent}
              locale={locale}
              isLastResort={company.isLastResort}
              size="lg"
            />
            
            <div className="flex flex-col gap-1.5 items-end">
              <QualityDot flag={company.priceRecord.data_quality_flag} showText={true} />
              {getMarketStatusLabel()}
            </div>
          </div>
        ) : (
          <span className="text-sm text-text-secondary">{t('noDataAvailable')}</span>
        )}

        <div className="w-[1px] h-10 bg-white/10" />

        {/* Watchlist Toggle */}
        <button
          onClick={handleToggleWatchlist}
          className={`
            p-3 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer
            ${isWatchlisted 
              ? 'bg-accent-blue/15 border-accent-blue text-accent-blue hover:bg-accent-blue/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]' 
              : 'border-white/5 bg-white/5 text-text-secondary hover:border-white/10 hover:text-text-primary'
            }
          `}
          title={isWatchlisted ? tGlobal('watchlist.remove') : tGlobal('watchlist.add')}
        >
          {isWatchlisted ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
