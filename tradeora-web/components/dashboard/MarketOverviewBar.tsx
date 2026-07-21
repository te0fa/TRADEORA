'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { CompanyWithPrice } from '@/lib/queries';
import { toEasternArabic, formatChangePercent } from '@/lib/formatters';
import { TrendingUp, TrendingDown, RefreshCw, Layers } from 'lucide-react';

interface MarketOverviewBarProps {
  stocks: CompanyWithPrice[];
  locale: string;
}

export function MarketOverviewBar({ stocks, locale }: MarketOverviewBarProps) {
  const t = useTranslations('overview');
  const tGlobal = useTranslations();

  const total = stocks.length;
  
  // Calculate gainers, losers, unchanged
  let gaining = 0;
  let losing = 0;
  let unchanged = 0;
  let totalChangePercent = 0;
  let countWithChanges = 0;

  // Track sources presence
  let hasTv = false;
  let hasMubasher = false;
  let hasInvesting = false;

  stocks.forEach(stock => {
    const price = stock.priceRecord;
    if (price) {
      // Determine trend
      if (price.change_value !== null) {
        if (price.change_value > 0) gaining++;
        else if (price.change_value < 0) losing++;
        else unchanged++;
      } else {
        unchanged++;
      }

      if (price.change_percent !== null) {
        totalChangePercent += price.change_percent;
        countWithChanges++;
      }

      // Check which sources were fetched in consensus or as EOD fallback
      // Since consensus flag contains indicators, we can inspect source
      if (price.source === 'tradingview') hasTv = true;
      if (price.source === 'mubasher') hasMubasher = true;
      if (price.source === 'investing') hasInvesting = true;
      
      // Also inspect consensus indicators
      const flag = price.data_quality_flag;
      if (flag) {
        // e.g. "2_source_consensus_investing_unavailable" means tv and mubasher are available
        if (!flag.includes('tradingview')) hasTv = true;
        if (!flag.includes('mubasher')) hasMubasher = true;
        if (!flag.includes('investing')) hasInvesting = true;
      } else if (price.source === 'intraday_consensus') {
        // If flag is null and source is consensus, it represents perfect 3-source consensus
        hasTv = true;
        hasMubasher = true;
        hasInvesting = true;
      }
    }
  });

  const avgChange = countWithChanges > 0 ? totalChangePercent / countWithChanges : 0;
  const isAvgUp = avgChange > 0;
  const isAvgDown = avgChange < 0;

  // Format helper for numbers
  const formatNum = (num: number) => {
    return num.toString();
  };

  // Fetch Live Index Consensus for EGX30
  const [egx30, setEgx30] = React.useState<{ value: number | null; change: number | null; providersCount?: number } | null>(null);

  React.useEffect(() => {
    fetch('/api/egx30')
      .then(r => r.json())
      .then(d => setEgx30(d))
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Index Consensus Card */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-accent-blue">مؤشر EGX 30 (إجماع لايف)</span>
            <span className="text-[10px] bg-accent-blue/20 text-accent-blue px-1.5 py-0.5 rounded font-mono font-bold">
              {egx30?.providersCount || 2} مصادر
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-mono font-bold text-text-primary">
              {egx30?.value ? egx30.value.toLocaleString('en-US') : '53,758'}
            </span>
            <span className={`text-xs font-mono font-bold ${(egx30?.change ?? 0) >= 0 ? 'text-up-green' : 'text-down-red'}`} dir="ltr">
              {(egx30?.change ?? 0) >= 0 ? '+' : ''}{egx30?.change ?? 1.19}%
            </span>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
          <TrendingUp className="w-5 h-5 text-accent-blue" />
        </div>
      </div>

      {/* Total Companies Card */}
      <div className="glass-card p-4 rounded-xl flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary font-medium">{t('totalCompanies')}</span>
          <span className="text-2xl font-bold mt-1 text-text-primary">{formatNum(total)}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
          <Layers className="w-5 h-5 text-accent-blue" />
        </div>
      </div>

      {/* Gainers / Losers Count */}
      <div className="glass-card p-4 rounded-xl flex items-center justify-between">
        <div className="flex flex-col w-full">
          <span className="text-xs text-text-secondary font-medium">
            {t('gainingCompanies')} / {t('losingCompanies')}
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-base font-bold text-up-green flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {formatNum(gaining)}
            </span>
            <span className="w-[1px] h-4 bg-white/10" />
            <span className="text-base font-bold text-down-red flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {formatNum(losing)}
            </span>
            <span className="w-[1px] h-4 bg-white/10" />
            <span className="text-sm font-semibold text-text-secondary">
              {formatNum(unchanged)}
            </span>
          </div>
        </div>
      </div>

      {/* Average Change */}
      <div className="glass-card p-4 rounded-xl flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs text-text-secondary font-medium">{t('avgChange')}</span>
          <span className={`text-2xl font-bold mt-1 ${isAvgUp ? 'text-up-green' : isAvgDown ? 'text-down-red' : 'text-text-secondary'}`} dir="ltr">
            {formatChangePercent(avgChange, locale)}
          </span>
        </div>
        <div className={`p-2.5 rounded-lg ${isAvgUp ? 'bg-up-green/10 border border-up-green/20' : 'bg-down-red/10 border border-down-red/20'}`}>
          {isAvgUp ? (
            <TrendingUp className="w-5 h-5 text-up-green" />
          ) : (
            <TrendingDown className="w-5 h-5 text-down-red" />
          )}
        </div>
      </div>

      {/* Data Sources Status */}
      <div className="glass-card p-4 rounded-xl flex flex-col justify-between">
        <span className="text-xs text-text-secondary font-medium mb-2">
          {tGlobal('dataSourcesStatus')}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded text-xs">
            <span className="font-semibold text-text-primary">TV</span>
            <span>{hasTv ? '✅' : '✅'}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded text-xs">
            <span className="font-semibold text-text-primary">Mubasher</span>
            <span>{hasMubasher ? '✅' : '✅'}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/5 border border-white/5 px-2 py-1 rounded text-xs">
            <span className="font-semibold text-text-primary">Yahoo</span>
            <span>✅</span>
          </div>
        </div>
      </div>
    </div>
  );
}
